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

export interface IIntent {
  intent: string;
  applications: string[];
}

export interface IInstrument {
  ric: string;
  description: string;
}

export interface IContext {
  type: string;
  id?: IInstrument;
}

export interface IMethodImplementation {
  name: string;
  intent?: IMethodIntent[];
  onInvoke: (args: any) => Promise<any>;
}

export interface IIntent {
  intent: string;
  applications: string[];
}

export interface IListOfWindows {
  [key: string]: {
    intent: string;
    isOpened: boolean;
    isWeb: boolean;
  };
}

interface IMethodIntent {
  name: string;
  contexts?: string;
}
