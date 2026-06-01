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


export interface RabbitmqStatus {
  containerName: string;
  amqpPort: number;
  managementPort: number;
  bindMode: string;
  image: string;
  healthy: boolean;
}

export interface RedisStatus {
  containerName: string;
  port: number;
  persistence: string;
  bindMode: string;
  image: string;
  healthy: boolean;
}

export interface DaemonStatus {
  apiEndpoint: string;
  systemNetwork: string;
  databasePath: string;
  webUiStatus: string;
}

export interface DockerStatus {
  available: boolean;
}

export interface SystemStatus {
  rabbitmq: RabbitmqStatus;
  redis: RedisStatus;
  daemon: DaemonStatus;
  docker: DockerStatus;
}

export interface RawSystemStatusResponse {
  status?: string;
  docker?: {
    available?: boolean;
  };
  system?: {
    rabbitmq?: {
      container?: string;
      port?: number;
      mgmtPort?: number;
      healthy?: boolean;
    };
    redis?: {
      container?: string;
      port?: number;
      healthy?: boolean;
    };
  };
}

export interface SetupStatusResponse {
  completed: boolean;
}