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

const desktopJS = require('@morgan-stanley/desktopjs');

import {InitializeService} from '../initialize.servise';

import {IContext, IInstrument, IMethodImplementation} from '../app';
import {CONSTANTS} from '../app.constants';

@Component({
  selector: 'app-trade-ticket',
  templateUrl: './trade-ticket.component.html'
})
export class TradeTicketComponent implements OnInit, OnDestroy {
  public isInstrumentSelected: boolean = false;
  public selectedInstrument: string;
  public finalInstrumentPrice: string;
  public quantity: string = '1';
  public loading: boolean = true;
  private isGlueWindow: boolean;
  private instrumentPrice: number;
  private container: any;
  private fdc3ApiImpl;
  private subscriptions: Subscription[] = [];

  constructor(private initializeService: InitializeService) {
  }

  public ngOnInit(): void {
    this.isGlueWindow = (window as any).glue42gd;
    this.subscribeForFdc3Impl();
    this.initializeDesktopJS();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  public calculatePrice(event): void {
    const quantity: number = parseInt(event.target.value, 10);
    this.finalInstrumentPrice = `${this.instrumentPrice * quantity}`;
  }

  public closeWindow(): void {
    this.container.getCurrentWindow().close();
  }

  private subscribeForFdc3Impl(): void {
    this.subscriptions.push(this.initializeService.fdc3ApiImpl.subscribe((fdc3ApiImpl: any) => {
      this.loading = false;
      this.fdc3ApiImpl = fdc3ApiImpl;
      this.addContextListener();
      this.registerShowTradeTicketMethod();
    }));
  }

  private initializeDesktopJS(): void {
    this.container = desktopJS.resolveContainer();
  }

  private addContextListener(): void {
    this.fdc3ApiImpl.addContextListener((context: IContext) => {
      if (context.type === 'close-window') {
        if (this.isGlueWindow) {
          const args: {application: string} = {application: this.initializeService.getApplicationName()};
          this.fdc3ApiImpl.platforms[0].platformApi.invoke('Fdc3.Glue42.StopApplication', args)
            .catch((error) => {
              console.error(error);
            });
        } else {
          this.container.getCurrentWindow().close();
        }
      }
    });
  }

  private registerShowTradeTicketMethod(): void {
    const busName: string = this.initializeService.getBusName();
    const methodImplementation: IMethodImplementation = {
      name: `Fdc3.${busName}.ShowTradeTicket`,
      intent: [{
        name: CONSTANTS.intents.tradeTicket
      }],
      onInvoke: (context: IContext) => {
        return Promise.resolve(this.setInstrument(context.id));
      }
    };
    this.fdc3ApiImpl.platforms[0].platformApi.register(methodImplementation);
  }

  private setInstrument(instrument: IInstrument): void {
    this.quantity = '1';
    this.selectedInstrument = instrument.description;
    this.isInstrumentSelected = true;
    this.instrumentPrice = Math.floor(Math.random() * 1000);
    this.finalInstrumentPrice = `${this.instrumentPrice}`;
  }
}
