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


import type { UserRole } from "@/lib/storage";

export interface UserRecord {
  id?: string;
  username: string;
  role: UserRole;
  disabled: boolean;
  mustChange?: boolean;
  createdAt: string;
}

export interface CreateUserResponse {
  username: string;
  tempPassword: string;
}

export interface ResetPasswordResponse {
  username: string;
  tempPassword: string;
}