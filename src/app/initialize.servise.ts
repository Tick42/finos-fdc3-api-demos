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

import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Subject} from 'rxjs/index';
import {IApplication} from './app';

const InteropPlatform = require('glue-interop-api-impl');
const Fdc3Impl = require('com-glue42-finos-fdc3-api-impl');

@Injectable()
export class InitializeService {
  public readonly fdc3ApiImpl: Subject<any> = new Subject<any>();
  private busName: string;
  private username: string;
  private password: string;
  private isGlueWindow: boolean;

  constructor(private router: Router) {
  }

  public initializeFdc3APIImpl(): void {
    this.isGlueWindow = (window as any).glue42gd;
    this.setLoginDetails();
    if (this.username && this.busName) {
      try {
        const typeSpecificInteropPlatform = InteropPlatform(this.getInteropPlatformConfig(), this.busName);
        const fdc3ImplReady = Fdc3Impl([typeSpecificInteropPlatform]);
        fdc3ImplReady.then((fdc3Impl) => {
          this.fdc3ApiImpl.next(fdc3Impl);
        });
      } catch (error) {
        console.error(error);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  public getBusName(): string {
    return this.busName;
  }

  public getApplicationName(): string {
    const currentUrl: string = location.href.split('/')[location.href.split('/').length - 1];
    switch (currentUrl) {
      case 'instrument-list':
        return this.isGlueWindow ? 'instrument-list-glue42' : 'instrument-list-web';
        break;
      case 'instrument-price-chart':
        return this.isGlueWindow ? 'instrument-price-chart-main-glue42' : 'instrument-price-chart-main-web';
        break;
      case 'instrument-price-chart#1':
        return this.isGlueWindow ? 'instrument-price-chart-glue42' : 'instrument-price-chart-web';
        break;
      case 'trade-ticket':
        return this.isGlueWindow ? 'trade-ticket-glue42' : 'trade-ticket-web';
        break;
      default:
        return 'fdc3-demo-app';
    }
  }

  public  getApplication(): IApplication {
    const appName: string = this.getApplicationName();
    return {
      appId: appName,
      name: appName,
      manifest: '',
      manifestType: ''
    };
  }

  private setLoginDetails(): void {
    this.busName = this.isGlueWindow ? 'Glue42' : window.localStorage.getItem('fdc3-demo-bus');
    this.username = window.localStorage.getItem('fdc3-demo-username');
    this.password = window.localStorage.getItem('fdc3-demo-password') || '';
  }

  private getInteropPlatformConfig(): any {
    if (this.isGlueWindow) {
      return {
        application: this.getApplicationName()
      };
    }

    return {
      application: this.getApplicationName(),
      gateway: {
        protocolVersion: 3,
        ws: 'ws://127.0.0.1:8385/gw',
      },
      auth: {
        username: this.username,
        password: this.password
      }
    };
  }
}
