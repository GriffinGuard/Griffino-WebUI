// Copyright 2025 GriffinGuard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


export interface ProviderEntry {
  providerId: string;
  providerTopic: string;
  weight: number;
}

export interface Route {
  pluginId: string;
  slot: string;
  capabilityType: string;
  providers: ProviderEntry[];
  strategy: "fallback" | "round_robin";
}

export interface RoutesResponse {
  routes: Route[];
}