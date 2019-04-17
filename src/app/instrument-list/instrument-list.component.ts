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

import {IContext, IInstrument, IIntent, IListOfWindows} from '../app';
import {CONSTANTS} from '../app.constants';

const instrumentList = require('../../assets/instruments.json');

@Component({
  selector: 'app-instrument-list',
  templateUrl: './instrument-list.component.html'
})
export class InstrumentListComponent implements OnInit, OnDestroy {
  public instruments: IInstrument[] = instrumentList;
  public intents: IIntent[] = [];
  public loading: boolean = true;
  public isGlueWindow: boolean;
  private fdc3ApiImpl: any;
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
      type: 'instrument',
      id: instrument
    };
    this.fdc3ApiImpl.broadcast(context);
  }

  public async raiseIntent(intent: string, instrument: IInstrument, app: string): Promise<void> {
    const context: IContext = {
      type: 'instrument',
      id: instrument
    };
    if (this.listOfWindows[app].isOpened) {
      this.fdc3ApiImpl.raiseIntent(intent, context, app);
    } else {
      this.startAppAndRaiseIntent(intent, instrument, app);
    }
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private subscribeForFdc3Impl(): void {
    this.subscriptions.push(this.initializeService.fdc3ApiImpl.subscribe(async (fdc3ApiImpl: any) => {
      this.loading = false;
      this.fdc3ApiImpl = fdc3ApiImpl;
      this.fdc3ApiImpl.broadcast({type: 'close-window'});
      const findIntentsInvocation = await this.fdc3ApiImpl.platforms[0].platformApi.invoke(`Fdc3.${this.busName}.FindIntents`);
      this.intents = findIntentsInvocation.result;
      this.setListOfWindows();
    }));
  }

  private initializeDesktopJS(): void {
    this.container = desktopJS.resolveContainer();
  }

  private async startAppAndRaiseIntent(intent: string, instrument: IInstrument, app: string): Promise<void> {
    try {
      this.startApp(app);
      this.addIntentListener(intent, instrument, app);
    } catch (error) {
      console.error(error);
    }
  }

  private startApp(app: string): void {
    if (this.listOfWindows[app].isWeb) {
      let url: string;
      if (this.listOfWindows[app].intent === CONSTANTS.intents.instrumentPriceChart) {
        url = CONSTANTS.windowUrls.instrumentPriceChart;
      } else if (this.listOfWindows[app].intent === CONSTANTS.intents.tradeTicket) {
        url = CONSTANTS.windowUrls.tradeTicket;
      }
      this.container.createWindow(url, {name: app})
        .then((wnd) => this.listOfWindows[wnd.name].isOpened = true);
    } else {
      this.fdc3ApiImpl.platforms[0].platformApi
        .invoke('Fdc3.Glue42.StartApplication', {name: app});
      this.listOfWindows[app].isOpened = true;
    }
  }

  private addIntentListener(intent: string, instrument: IInstrument, app: string): void {
    const context: IContext = {
      type: 'instrument',
      id: instrument
    };
    if (intent === CONSTANTS.intents.instrumentPriceChart) {
      this.addIntentForShowChartListener = this.fdc3ApiImpl.addIntentListener(intent, () => {
        this.fdc3ApiImpl.raiseIntent(intent, context, app);
        this.addIntentForShowChartListener.unsubscribe();
      });
    } else if (intent === CONSTANTS.intents.tradeTicket) {
      this.addIntentForShowTradeTicketListener = this.fdc3ApiImpl.addIntentListener(intent, () => {
        this.fdc3ApiImpl.raiseIntent(intent, context, app);
        this.addIntentForShowTradeTicketListener.unsubscribe();
      });
    }
  }

  private setListOfWindows(): void {
    this.intents.forEach((intent: IIntent) => {
      intent.applications.forEach((appName: string) => {
        this.listOfWindows[appName] = {
          intent: intent.intent,
          isOpened: false,
          isWeb: appName.includes('web')
        };
      });
    });
  }
}
