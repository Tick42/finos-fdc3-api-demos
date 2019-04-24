/**
 * Copyright © 2014-2019 Tick42 OOD
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs/index';
import {Router} from '@angular/router';

const desktopJS = require('@morgan-stanley/desktopjs');

import {InitializeService} from '../initialize.servise';

import {IApplication, IContext, IInstrument, IIntent, IListOfWindows, IWindow} from '../app';
import {CONSTANTS} from '../app.constants';

const instrumentList = require('../../assets/instruments.json');

@Component({
  selector: 'app-instrument-list',
  templateUrl: './instrument-list.component.html'
})
export class InstrumentListComponent implements OnInit, OnDestroy {
  public instruments: IInstrument[];
  public intents: IIntent[] = [];
  public loading: boolean = true;
  public isGlueWindow: boolean;
  private fdc3ApiImpl: any;
  private fdc3PlatformApi: any;
  private container: any;
  private listOfWindows: IListOfWindows = {};
  private addIntentForShowChartListener: {unsubscribe: () => any};
  private addIntentForShowTradeTicketListener: {unsubscribe: () => any};
  private busName: string;
  private subscriptions: Subscription[] = [];

  constructor(private initializeService: InitializeService,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.setInstrumentList();
    this.subscribeForFdc3Impl();
    this.initializeDesktopJS();
    this.busName = this.initializeService.getBusName();
    this.isGlueWindow = (window as any).glue42gd;
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  public broadcast(instrument: IInstrument): void {
    if (!this.fdc3ApiImpl) {
      return;
    }
    const context: IContext = {
      type: 'fdc3.instrument',
      id: instrument
    };
    this.fdc3ApiImpl.platforms[0].platformApi.invoke(`Fdc3.Toolbar.Broadcast`, context);
  }

  public async raiseIntent(intent: string, instrument: IInstrument, app: IApplication): Promise<void> {
    const context: IContext = {
      type: 'fdc3.instrument',
      id: instrument
    };
    if (this.listOfWindows[app.appId].isOpened) {
      const appName: string = app.title.toLowerCase().includes('eikon') ? CONSTANTS.eikonManagerModuleApp : app.name;
      this.fdc3ApiImpl.raiseIntent(intent, context, appName);
    } else {
      this.startAppAndRaiseIntent(intent, instrument, app, context);
    }
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private setInstrumentList(): void {
    this.instruments = this.sort(instrumentList, 'description');
  }

  private subscribeForFdc3Impl(): void {
    this.subscriptions.push(this.initializeService.fdc3ApiImpl.subscribe(async (fdc3ApiImpl: any) => {
      this.loading = false;
      this.fdc3ApiImpl = fdc3ApiImpl
      this.fdc3PlatformApi = this.fdc3ApiImpl.platforms[0].platformApi;
      this.fdc3ApiImpl.broadcast({type: 'close-window'});
      const findIntentsInvocation = await this.fdc3PlatformApi.invoke(`Fdc3.Toolbar.FindIntents`);
      this.addIntentListenerForEikon();
      this.setIntents(findIntentsInvocation.result);
      this.setListOfWindows();
    }));
  }

  private initializeDesktopJS(): void {
    this.container = desktopJS.resolveContainer();
  }

  private async startAppAndRaiseIntent(intent: string, instrument: IInstrument, app: IApplication, context: IContext): Promise<void> {
    try {
      this.startApp(app);
      if (app.title.toLowerCase().includes('eikon')) {
        this.fdc3ApiImpl.raiseIntent(intent, context, CONSTANTS.eikonManagerModuleApp);
      } else {
        this.addIntentListener(intent, instrument, app.name);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private startApp(app: IApplication): void {
    const currentWindow: IWindow = this.listOfWindows[app.appId];
    if (currentWindow.isWeb) {
      let url: string;
      if (currentWindow.intent === CONSTANTS.intents.instrumentPriceChart) {
        url = CONSTANTS.windowUrls.instrumentPriceChart;
      } else if (currentWindow.intent === CONSTANTS.intents.tradeTicket) {
        url = CONSTANTS.windowUrls.tradeTicket;
      }
      this.container.createWindow(url, {name: app.name})
        .then((wnd) => this.listOfWindows[wnd.name].isOpened = true);
    } else {
      const platformName: string = app.title.toLowerCase().includes('eikon') ? 'Eikon' : 'Toolbar';
      const methodName: string = `Fdc3.${platformName}.StartApplication`;
      this.fdc3PlatformApi.invoke(methodName, {application: app});
      currentWindow.isOpened = true;
    }
  }

  private addIntentListener(intent: string, instrument: IInstrument, appName: string): void {
    const context: IContext = {
      type: 'fdc3.instrument',
      id: instrument
    };
    if (intent === CONSTANTS.intents.instrumentPriceChart) {
      this.addIntentForShowChartListener = this.fdc3ApiImpl.addIntentListener(intent, () => {
        this.fdc3ApiImpl.raiseIntent(intent, context, appName);
        this.addIntentForShowChartListener.unsubscribe();
      });
    } else if (intent === CONSTANTS.intents.tradeTicket) {
      this.addIntentForShowTradeTicketListener = this.fdc3ApiImpl.addIntentListener(intent, () => {
        this.fdc3ApiImpl.raiseIntent(intent, context, appName);
        this.addIntentForShowTradeTicketListener.unsubscribe();
      });
    }
  }

  private addIntentListenerForEikon(): void {
    this.fdc3ApiImpl.addIntentListener(CONSTANTS.intents.news, async () => {
      const findIntentsInvocation = await this.fdc3PlatformApi.invoke(`Fdc3.Toolbar.FindIntents`);
      this.setIntents(findIntentsInvocation.result);
      this.setListOfWindows();
    });
  }
  private setIntents(intents: IIntent[]): void {
    this.intents = intents.map((intent: IIntent) => {
      intent.apps = this.sort(intent.apps, 'name');
      intent.apps.map((app: IApplication) => {
        app.show = true;
        return app;
      });
      intent.show = intent.apps.filter((app: IApplication) => app.show).length > 0;
      return intent;
    });
  }

  private setListOfWindows(): void {
    this.intents.forEach((intent: IIntent) => {
      intent.apps.forEach((app: IApplication) => {
        this.listOfWindows[app.appId] = {
          intent: intent.intent.name,
          isOpened: false,
          isWeb: app.appId.includes('web')
        };
      });
    });
  }

  private sort(arr: any[], key: string): any[] {
    return arr.sort((a, b) =>
      a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
    );
  }
}
