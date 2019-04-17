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

import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs/index';
import {Chart} from 'chart.js';

import {InitializeService} from '../initialize.servise';

import {IContext, IInstrument, IMethodImplementation} from '../app';
import {CONSTANTS} from '../app.constants';

const desktopJS = require('@morgan-stanley/desktopjs');

const chartData = require('../../assets/instrument-chart-data.json');

@Component({
  selector: 'app-instrument-price-chart',
  templateUrl: './instrument-price-chart.component.html'
})
export class InstrumentPriceChartComponent implements OnInit, OnDestroy {
  @ViewChild('canvas') chartElementRef: ElementRef;
  public isInstrumentSelected: boolean = false;
  public selectedInstrument: string;
  public loading: boolean = true;
  public isMainChart: boolean;
  private isGlueWindow: boolean;
  private fdc3ApiImpl;
  private container: any;
  private chartData: any[] = chartData;
  private years: string[] = [];
  private prices: number[] = [];
  private chart = [];
  private subscriptions: Subscription[] = [];

  constructor(private initializeService: InitializeService) {
  }

  public ngOnInit(): void {
    this.isGlueWindow = (window as any).glue42gd;
    this.isMainChart = !location.hash.substr(1);
    this.subscribeForFdc3Impl();
    this.initializeDesktopJS();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  private subscribeForFdc3Impl(): void {
    this.subscriptions.push(this.initializeService.fdc3ApiImpl.subscribe((fdc3ApiImpl: any) => {
      this.loading = false;
      this.fdc3ApiImpl = fdc3ApiImpl;
      this.addContextListener();
      if (!this.isMainChart) {
        this.registerShowChartMethod();
      }
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
      } else if (context.type === 'instrument' && this.isMainChart) {
        this.updateChart(context.id);
      }
    });
  }

  private updateChart(instrument: IInstrument): void {
    this.clearChart();
    this.selectedInstrument = instrument.description;
    this.isInstrumentSelected = true;
    this.createChart();
  }

  private clearChart(): void {
    this.years = [];
    this.prices = [];
    this.chart = [];
  }

  private createChart(): void {
    this.chartData.forEach((data: {year: string}) => {
      this.years.push(data.year);
      this.prices.push(Math.floor(Math.random() * 1000));
    });
    this.chart = new Chart(this.chartElementRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.years,
        datasets: [
          {
            data: this.prices,
            borderColor: '#fff',
            fill: false
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: true
          }],
          yAxes: [{
            display: true
          }],
        }
      }
    });
  }

  private registerShowChartMethod(): void {
    const busName: string = this.initializeService.getBusName();
    const methodImplementation: IMethodImplementation = {
      name: `Fdc3.${busName}.ShowChart`,
      intent: [{
        name: CONSTANTS.intents.instrumentPriceChart
      }],
      onInvoke: (context: IContext) => {
        return Promise.resolve(this.updateChart(context.id));
      }
    };
    this.fdc3ApiImpl.platforms[0].platformApi.register(methodImplementation);
  }
}
