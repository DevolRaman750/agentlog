import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb'; // proto import: "google/protobuf/struct.proto"


export class User extends jspb.Message {
  getId(): string;
  setId(value: string): User;

  getUsername(): string;
  setUsername(value: string): User;

  getEmail(): string;
  setEmail(value: string): User;

  getEmailVerified(): boolean;
  setEmailVerified(value: boolean): User;

  getIsTemporary(): boolean;
  setIsTemporary(value: boolean): User;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasCreatedAt(): boolean;
  clearCreatedAt(): User;

  getUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasUpdatedAt(): boolean;
  clearUpdatedAt(): User;

  getLastLoginAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastLoginAt(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasLastLoginAt(): boolean;
  clearLastLoginAt(): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    id: string,
    username: string,
    email: string,
    emailVerified: boolean,
    isTemporary: boolean,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    updatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastLoginAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class LoginRequest extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): LoginRequest;

  getPassword(): string;
  setPassword(value: string): LoginRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LoginRequest): LoginRequest.AsObject;
  static serializeBinaryToWriter(message: LoginRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginRequest;
  static deserializeBinaryFromReader(message: LoginRequest, reader: jspb.BinaryReader): LoginRequest;
}

export namespace LoginRequest {
  export type AsObject = {
    username: string,
    password: string,
  }
}

export class LoginResponse extends jspb.Message {
  getToken(): string;
  setToken(value: string): LoginResponse;

  getUser(): User | undefined;
  setUser(value?: User): LoginResponse;
  hasUser(): boolean;
  clearUser(): LoginResponse;

  getExpiresAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setExpiresAt(value?: google_protobuf_timestamp_pb.Timestamp): LoginResponse;
  hasExpiresAt(): boolean;
  clearExpiresAt(): LoginResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LoginResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LoginResponse): LoginResponse.AsObject;
  static serializeBinaryToWriter(message: LoginResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LoginResponse;
  static deserializeBinaryFromReader(message: LoginResponse, reader: jspb.BinaryReader): LoginResponse;
}

export namespace LoginResponse {
  export type AsObject = {
    token: string,
    user?: User.AsObject,
    expiresAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class RegisterRequest extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): RegisterRequest;

  getEmail(): string;
  setEmail(value: string): RegisterRequest;

  getPassword(): string;
  setPassword(value: string): RegisterRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterRequest): RegisterRequest.AsObject;
  static serializeBinaryToWriter(message: RegisterRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterRequest;
  static deserializeBinaryFromReader(message: RegisterRequest, reader: jspb.BinaryReader): RegisterRequest;
}

export namespace RegisterRequest {
  export type AsObject = {
    username: string,
    email: string,
    password: string,
  }
}

export class RegisterResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): RegisterResponse;
  hasUser(): boolean;
  clearUser(): RegisterResponse;

  getToken(): string;
  setToken(value: string): RegisterResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterResponse): RegisterResponse.AsObject;
  static serializeBinaryToWriter(message: RegisterResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterResponse;
  static deserializeBinaryFromReader(message: RegisterResponse, reader: jspb.BinaryReader): RegisterResponse;
}

export namespace RegisterResponse {
  export type AsObject = {
    user?: User.AsObject,
    token: string,
  }
}

export class CreateTemporaryUserRequest extends jspb.Message {
  getSessionId(): string;
  setSessionId(value: string): CreateTemporaryUserRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTemporaryUserRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTemporaryUserRequest): CreateTemporaryUserRequest.AsObject;
  static serializeBinaryToWriter(message: CreateTemporaryUserRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTemporaryUserRequest;
  static deserializeBinaryFromReader(message: CreateTemporaryUserRequest, reader: jspb.BinaryReader): CreateTemporaryUserRequest;
}

export namespace CreateTemporaryUserRequest {
  export type AsObject = {
    sessionId: string,
  }
}

export class CreateTemporaryUserResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): CreateTemporaryUserResponse;
  hasUser(): boolean;
  clearUser(): CreateTemporaryUserResponse;

  getTemporaryPassword(): string;
  setTemporaryPassword(value: string): CreateTemporaryUserResponse;

  getToken(): string;
  setToken(value: string): CreateTemporaryUserResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateTemporaryUserResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateTemporaryUserResponse): CreateTemporaryUserResponse.AsObject;
  static serializeBinaryToWriter(message: CreateTemporaryUserResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateTemporaryUserResponse;
  static deserializeBinaryFromReader(message: CreateTemporaryUserResponse, reader: jspb.BinaryReader): CreateTemporaryUserResponse;
}

export namespace CreateTemporaryUserResponse {
  export type AsObject = {
    user?: User.AsObject,
    temporaryPassword: string,
    token: string,
  }
}

export class SaveTemporaryAccountRequest extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): SaveTemporaryAccountRequest;

  getCurrentPassword(): string;
  setCurrentPassword(value: string): SaveTemporaryAccountRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveTemporaryAccountRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SaveTemporaryAccountRequest): SaveTemporaryAccountRequest.AsObject;
  static serializeBinaryToWriter(message: SaveTemporaryAccountRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveTemporaryAccountRequest;
  static deserializeBinaryFromReader(message: SaveTemporaryAccountRequest, reader: jspb.BinaryReader): SaveTemporaryAccountRequest;
}

export namespace SaveTemporaryAccountRequest {
  export type AsObject = {
    email: string,
    currentPassword: string,
  }
}

export class SaveTemporaryAccountResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): SaveTemporaryAccountResponse;
  hasUser(): boolean;
  clearUser(): SaveTemporaryAccountResponse;

  getEmailSent(): boolean;
  setEmailSent(value: boolean): SaveTemporaryAccountResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SaveTemporaryAccountResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SaveTemporaryAccountResponse): SaveTemporaryAccountResponse.AsObject;
  static serializeBinaryToWriter(message: SaveTemporaryAccountResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SaveTemporaryAccountResponse;
  static deserializeBinaryFromReader(message: SaveTemporaryAccountResponse, reader: jspb.BinaryReader): SaveTemporaryAccountResponse;
}

export namespace SaveTemporaryAccountResponse {
  export type AsObject = {
    user?: User.AsObject,
    emailSent: boolean,
  }
}

export class VerifyEmailRequest extends jspb.Message {
  getToken(): string;
  setToken(value: string): VerifyEmailRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyEmailRequest.AsObject;
  static toObject(includeInstance: boolean, msg: VerifyEmailRequest): VerifyEmailRequest.AsObject;
  static serializeBinaryToWriter(message: VerifyEmailRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerifyEmailRequest;
  static deserializeBinaryFromReader(message: VerifyEmailRequest, reader: jspb.BinaryReader): VerifyEmailRequest;
}

export namespace VerifyEmailRequest {
  export type AsObject = {
    token: string,
  }
}

export class VerifyEmailResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): VerifyEmailResponse;
  hasUser(): boolean;
  clearUser(): VerifyEmailResponse;

  getVerified(): boolean;
  setVerified(value: boolean): VerifyEmailResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyEmailResponse.AsObject;
  static toObject(includeInstance: boolean, msg: VerifyEmailResponse): VerifyEmailResponse.AsObject;
  static serializeBinaryToWriter(message: VerifyEmailResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerifyEmailResponse;
  static deserializeBinaryFromReader(message: VerifyEmailResponse, reader: jspb.BinaryReader): VerifyEmailResponse;
}

export namespace VerifyEmailResponse {
  export type AsObject = {
    user?: User.AsObject,
    verified: boolean,
  }
}

export class GetCurrentUserRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCurrentUserRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetCurrentUserRequest): GetCurrentUserRequest.AsObject;
  static serializeBinaryToWriter(message: GetCurrentUserRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCurrentUserRequest;
  static deserializeBinaryFromReader(message: GetCurrentUserRequest, reader: jspb.BinaryReader): GetCurrentUserRequest;
}

export namespace GetCurrentUserRequest {
  export type AsObject = {
  }
}

export class GetCurrentUserResponse extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): GetCurrentUserResponse;
  hasUser(): boolean;
  clearUser(): GetCurrentUserResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetCurrentUserResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetCurrentUserResponse): GetCurrentUserResponse.AsObject;
  static serializeBinaryToWriter(message: GetCurrentUserResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetCurrentUserResponse;
  static deserializeBinaryFromReader(message: GetCurrentUserResponse, reader: jspb.BinaryReader): GetCurrentUserResponse;
}

export namespace GetCurrentUserResponse {
  export type AsObject = {
    user?: User.AsObject,
  }
}

export class ExecuteRequest extends jspb.Message {
  getExecutionRunName(): string;
  setExecutionRunName(value: string): ExecuteRequest;

  getDescription(): string;
  setDescription(value: string): ExecuteRequest;

  getBasePrompt(): string;
  setBasePrompt(value: string): ExecuteRequest;

  getContext(): string;
  setContext(value: string): ExecuteRequest;

  getEnableFunctionCalling(): boolean;
  setEnableFunctionCalling(value: boolean): ExecuteRequest;

  getConfigurationsList(): Array<APIConfiguration>;
  setConfigurationsList(value: Array<APIConfiguration>): ExecuteRequest;
  clearConfigurationsList(): ExecuteRequest;
  addConfigurations(value?: APIConfiguration, index?: number): APIConfiguration;

  getFunctionToolsList(): Array<Tool>;
  setFunctionToolsList(value: Array<Tool>): ExecuteRequest;
  clearFunctionToolsList(): ExecuteRequest;
  addFunctionTools(value?: Tool, index?: number): Tool;

  getComparisonConfig(): ComparisonConfig | undefined;
  setComparisonConfig(value?: ComparisonConfig): ExecuteRequest;
  hasComparisonConfig(): boolean;
  clearComparisonConfig(): ExecuteRequest;

  getUseMock(): boolean;
  setUseMock(value: boolean): ExecuteRequest;

  getOpenweatherApiKey(): string;
  setOpenweatherApiKey(value: string): ExecuteRequest;

  getNeo4jUrl(): string;
  setNeo4jUrl(value: string): ExecuteRequest;

  getNeo4jUsername(): string;
  setNeo4jUsername(value: string): ExecuteRequest;

  getNeo4jPassword(): string;
  setNeo4jPassword(value: string): ExecuteRequest;

  getNeo4jDatabase(): string;
  setNeo4jDatabase(value: string): ExecuteRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecuteRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ExecuteRequest): ExecuteRequest.AsObject;
  static serializeBinaryToWriter(message: ExecuteRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecuteRequest;
  static deserializeBinaryFromReader(message: ExecuteRequest, reader: jspb.BinaryReader): ExecuteRequest;
}

export namespace ExecuteRequest {
  export type AsObject = {
    executionRunName: string,
    description: string,
    basePrompt: string,
    context: string,
    enableFunctionCalling: boolean,
    configurationsList: Array<APIConfiguration.AsObject>,
    functionToolsList: Array<Tool.AsObject>,
    comparisonConfig?: ComparisonConfig.AsObject,
    useMock: boolean,
    openweatherApiKey: string,
    neo4jUrl: string,
    neo4jUsername: string,
    neo4jPassword: string,
    neo4jDatabase: string,
  }
}

export class ExecuteResponse extends jspb.Message {
  getExecutionId(): string;
  setExecutionId(value: string): ExecuteResponse;

  getMessage(): string;
  setMessage(value: string): ExecuteResponse;

  getExecutionRun(): ExecutionRun | undefined;
  setExecutionRun(value?: ExecutionRun): ExecuteResponse;
  hasExecutionRun(): boolean;
  clearExecutionRun(): ExecuteResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecuteResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ExecuteResponse): ExecuteResponse.AsObject;
  static serializeBinaryToWriter(message: ExecuteResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecuteResponse;
  static deserializeBinaryFromReader(message: ExecuteResponse, reader: jspb.BinaryReader): ExecuteResponse;
}

export namespace ExecuteResponse {
  export type AsObject = {
    executionId: string,
    message: string,
    executionRun?: ExecutionRun.AsObject,
  }
}

export class GetExecutionStatusRequest extends jspb.Message {
  getExecutionId(): string;
  setExecutionId(value: string): GetExecutionStatusRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetExecutionStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetExecutionStatusRequest): GetExecutionStatusRequest.AsObject;
  static serializeBinaryToWriter(message: GetExecutionStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetExecutionStatusRequest;
  static deserializeBinaryFromReader(message: GetExecutionStatusRequest, reader: jspb.BinaryReader): GetExecutionStatusRequest;
}

export namespace GetExecutionStatusRequest {
  export type AsObject = {
    executionId: string,
  }
}

export class GetExecutionStatusResponse extends jspb.Message {
  getStatus(): string;
  setStatus(value: string): GetExecutionStatusResponse;

  getErrorMessage(): string;
  setErrorMessage(value: string): GetExecutionStatusResponse;

  getStartTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStartTime(value?: google_protobuf_timestamp_pb.Timestamp): GetExecutionStatusResponse;
  hasStartTime(): boolean;
  clearStartTime(): GetExecutionStatusResponse;

  getEndTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setEndTime(value?: google_protobuf_timestamp_pb.Timestamp): GetExecutionStatusResponse;
  hasEndTime(): boolean;
  clearEndTime(): GetExecutionStatusResponse;

  getResult(): ExecutionResult | undefined;
  setResult(value?: ExecutionResult): GetExecutionStatusResponse;
  hasResult(): boolean;
  clearResult(): GetExecutionStatusResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetExecutionStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetExecutionStatusResponse): GetExecutionStatusResponse.AsObject;
  static serializeBinaryToWriter(message: GetExecutionStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetExecutionStatusResponse;
  static deserializeBinaryFromReader(message: GetExecutionStatusResponse, reader: jspb.BinaryReader): GetExecutionStatusResponse;
}

export namespace GetExecutionStatusResponse {
  export type AsObject = {
    status: string,
    errorMessage: string,
    startTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    endTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    result?: ExecutionResult.AsObject,
  }
}

export class GetExecutionResultRequest extends jspb.Message {
  getExecutionRunId(): string;
  setExecutionRunId(value: string): GetExecutionResultRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetExecutionResultRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetExecutionResultRequest): GetExecutionResultRequest.AsObject;
  static serializeBinaryToWriter(message: GetExecutionResultRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetExecutionResultRequest;
  static deserializeBinaryFromReader(message: GetExecutionResultRequest, reader: jspb.BinaryReader): GetExecutionResultRequest;
}

export namespace GetExecutionResultRequest {
  export type AsObject = {
    executionRunId: string,
  }
}

export class GetExecutionResultResponse extends jspb.Message {
  getResult(): ExecutionResult | undefined;
  setResult(value?: ExecutionResult): GetExecutionResultResponse;
  hasResult(): boolean;
  clearResult(): GetExecutionResultResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetExecutionResultResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetExecutionResultResponse): GetExecutionResultResponse.AsObject;
  static serializeBinaryToWriter(message: GetExecutionResultResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetExecutionResultResponse;
  static deserializeBinaryFromReader(message: GetExecutionResultResponse, reader: jspb.BinaryReader): GetExecutionResultResponse;
}

export namespace GetExecutionResultResponse {
  export type AsObject = {
    result?: ExecutionResult.AsObject,
  }
}

export class ListExecutionRunsRequest extends jspb.Message {
  getLimit(): number;
  setLimit(value: number): ListExecutionRunsRequest;

  getOffset(): number;
  setOffset(value: number): ListExecutionRunsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListExecutionRunsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListExecutionRunsRequest): ListExecutionRunsRequest.AsObject;
  static serializeBinaryToWriter(message: ListExecutionRunsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListExecutionRunsRequest;
  static deserializeBinaryFromReader(message: ListExecutionRunsRequest, reader: jspb.BinaryReader): ListExecutionRunsRequest;
}

export namespace ListExecutionRunsRequest {
  export type AsObject = {
    limit: number,
    offset: number,
  }
}

export class ListExecutionRunsResponse extends jspb.Message {
  getExecutionRunsList(): Array<ExecutionRun>;
  setExecutionRunsList(value: Array<ExecutionRun>): ListExecutionRunsResponse;
  clearExecutionRunsList(): ListExecutionRunsResponse;
  addExecutionRuns(value?: ExecutionRun, index?: number): ExecutionRun;

  getTotalCount(): number;
  setTotalCount(value: number): ListExecutionRunsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListExecutionRunsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListExecutionRunsResponse): ListExecutionRunsResponse.AsObject;
  static serializeBinaryToWriter(message: ListExecutionRunsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListExecutionRunsResponse;
  static deserializeBinaryFromReader(message: ListExecutionRunsResponse, reader: jspb.BinaryReader): ListExecutionRunsResponse;
}

export namespace ListExecutionRunsResponse {
  export type AsObject = {
    executionRunsList: Array<ExecutionRun.AsObject>,
    totalCount: number,
  }
}

export class DeleteExecutionRunRequest extends jspb.Message {
  getExecutionRunId(): string;
  setExecutionRunId(value: string): DeleteExecutionRunRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteExecutionRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteExecutionRunRequest): DeleteExecutionRunRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteExecutionRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteExecutionRunRequest;
  static deserializeBinaryFromReader(message: DeleteExecutionRunRequest, reader: jspb.BinaryReader): DeleteExecutionRunRequest;
}

export namespace DeleteExecutionRunRequest {
  export type AsObject = {
    executionRunId: string,
  }
}

export class DeleteExecutionRunResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): DeleteExecutionRunResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteExecutionRunResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteExecutionRunResponse): DeleteExecutionRunResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteExecutionRunResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteExecutionRunResponse;
  static deserializeBinaryFromReader(message: DeleteExecutionRunResponse, reader: jspb.BinaryReader): DeleteExecutionRunResponse;
}

export namespace DeleteExecutionRunResponse {
  export type AsObject = {
    message: string,
  }
}

export class ListConfigurationsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListConfigurationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListConfigurationsRequest): ListConfigurationsRequest.AsObject;
  static serializeBinaryToWriter(message: ListConfigurationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListConfigurationsRequest;
  static deserializeBinaryFromReader(message: ListConfigurationsRequest, reader: jspb.BinaryReader): ListConfigurationsRequest;
}

export namespace ListConfigurationsRequest {
  export type AsObject = {
  }
}

export class ListConfigurationsResponse extends jspb.Message {
  getConfigurationsList(): Array<APIConfiguration>;
  setConfigurationsList(value: Array<APIConfiguration>): ListConfigurationsResponse;
  clearConfigurationsList(): ListConfigurationsResponse;
  addConfigurations(value?: APIConfiguration, index?: number): APIConfiguration;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListConfigurationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListConfigurationsResponse): ListConfigurationsResponse.AsObject;
  static serializeBinaryToWriter(message: ListConfigurationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListConfigurationsResponse;
  static deserializeBinaryFromReader(message: ListConfigurationsResponse, reader: jspb.BinaryReader): ListConfigurationsResponse;
}

export namespace ListConfigurationsResponse {
  export type AsObject = {
    configurationsList: Array<APIConfiguration.AsObject>,
  }
}

export class CreateConfigurationRequest extends jspb.Message {
  getConfiguration(): APIConfiguration | undefined;
  setConfiguration(value?: APIConfiguration): CreateConfigurationRequest;
  hasConfiguration(): boolean;
  clearConfiguration(): CreateConfigurationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateConfigurationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateConfigurationRequest): CreateConfigurationRequest.AsObject;
  static serializeBinaryToWriter(message: CreateConfigurationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateConfigurationRequest;
  static deserializeBinaryFromReader(message: CreateConfigurationRequest, reader: jspb.BinaryReader): CreateConfigurationRequest;
}

export namespace CreateConfigurationRequest {
  export type AsObject = {
    configuration?: APIConfiguration.AsObject,
  }
}

export class CreateConfigurationResponse extends jspb.Message {
  getConfiguration(): APIConfiguration | undefined;
  setConfiguration(value?: APIConfiguration): CreateConfigurationResponse;
  hasConfiguration(): boolean;
  clearConfiguration(): CreateConfigurationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateConfigurationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateConfigurationResponse): CreateConfigurationResponse.AsObject;
  static serializeBinaryToWriter(message: CreateConfigurationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateConfigurationResponse;
  static deserializeBinaryFromReader(message: CreateConfigurationResponse, reader: jspb.BinaryReader): CreateConfigurationResponse;
}

export namespace CreateConfigurationResponse {
  export type AsObject = {
    configuration?: APIConfiguration.AsObject,
  }
}

export class UpdateConfigurationRequest extends jspb.Message {
  getId(): string;
  setId(value: string): UpdateConfigurationRequest;

  getConfiguration(): APIConfiguration | undefined;
  setConfiguration(value?: APIConfiguration): UpdateConfigurationRequest;
  hasConfiguration(): boolean;
  clearConfiguration(): UpdateConfigurationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateConfigurationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateConfigurationRequest): UpdateConfigurationRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateConfigurationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateConfigurationRequest;
  static deserializeBinaryFromReader(message: UpdateConfigurationRequest, reader: jspb.BinaryReader): UpdateConfigurationRequest;
}

export namespace UpdateConfigurationRequest {
  export type AsObject = {
    id: string,
    configuration?: APIConfiguration.AsObject,
  }
}

export class UpdateConfigurationResponse extends jspb.Message {
  getConfiguration(): APIConfiguration | undefined;
  setConfiguration(value?: APIConfiguration): UpdateConfigurationResponse;
  hasConfiguration(): boolean;
  clearConfiguration(): UpdateConfigurationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateConfigurationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateConfigurationResponse): UpdateConfigurationResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateConfigurationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateConfigurationResponse;
  static deserializeBinaryFromReader(message: UpdateConfigurationResponse, reader: jspb.BinaryReader): UpdateConfigurationResponse;
}

export namespace UpdateConfigurationResponse {
  export type AsObject = {
    configuration?: APIConfiguration.AsObject,
  }
}

export class DeleteConfigurationRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteConfigurationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteConfigurationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteConfigurationRequest): DeleteConfigurationRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteConfigurationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteConfigurationRequest;
  static deserializeBinaryFromReader(message: DeleteConfigurationRequest, reader: jspb.BinaryReader): DeleteConfigurationRequest;
}

export namespace DeleteConfigurationRequest {
  export type AsObject = {
    id: string,
  }
}

export class DeleteConfigurationResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): DeleteConfigurationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteConfigurationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteConfigurationResponse): DeleteConfigurationResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteConfigurationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteConfigurationResponse;
  static deserializeBinaryFromReader(message: DeleteConfigurationResponse, reader: jspb.BinaryReader): DeleteConfigurationResponse;
}

export namespace DeleteConfigurationResponse {
  export type AsObject = {
    message: string,
  }
}

export class ListFunctionsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFunctionsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListFunctionsRequest): ListFunctionsRequest.AsObject;
  static serializeBinaryToWriter(message: ListFunctionsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFunctionsRequest;
  static deserializeBinaryFromReader(message: ListFunctionsRequest, reader: jspb.BinaryReader): ListFunctionsRequest;
}

export namespace ListFunctionsRequest {
  export type AsObject = {
  }
}

export class ListFunctionsResponse extends jspb.Message {
  getFunctionsList(): Array<FunctionDefinition>;
  setFunctionsList(value: Array<FunctionDefinition>): ListFunctionsResponse;
  clearFunctionsList(): ListFunctionsResponse;
  addFunctions(value?: FunctionDefinition, index?: number): FunctionDefinition;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFunctionsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListFunctionsResponse): ListFunctionsResponse.AsObject;
  static serializeBinaryToWriter(message: ListFunctionsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFunctionsResponse;
  static deserializeBinaryFromReader(message: ListFunctionsResponse, reader: jspb.BinaryReader): ListFunctionsResponse;
}

export namespace ListFunctionsResponse {
  export type AsObject = {
    functionsList: Array<FunctionDefinition.AsObject>,
  }
}

export class GetFunctionRequest extends jspb.Message {
  getId(): string;
  setId(value: string): GetFunctionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFunctionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetFunctionRequest): GetFunctionRequest.AsObject;
  static serializeBinaryToWriter(message: GetFunctionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFunctionRequest;
  static deserializeBinaryFromReader(message: GetFunctionRequest, reader: jspb.BinaryReader): GetFunctionRequest;
}

export namespace GetFunctionRequest {
  export type AsObject = {
    id: string,
  }
}

export class GetFunctionResponse extends jspb.Message {
  getFunction(): FunctionDefinition | undefined;
  setFunction(value?: FunctionDefinition): GetFunctionResponse;
  hasFunction(): boolean;
  clearFunction(): GetFunctionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetFunctionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetFunctionResponse): GetFunctionResponse.AsObject;
  static serializeBinaryToWriter(message: GetFunctionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetFunctionResponse;
  static deserializeBinaryFromReader(message: GetFunctionResponse, reader: jspb.BinaryReader): GetFunctionResponse;
}

export namespace GetFunctionResponse {
  export type AsObject = {
    pb_function?: FunctionDefinition.AsObject,
  }
}

export class CreateFunctionRequest extends jspb.Message {
  getFunction(): FunctionDefinition | undefined;
  setFunction(value?: FunctionDefinition): CreateFunctionRequest;
  hasFunction(): boolean;
  clearFunction(): CreateFunctionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateFunctionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateFunctionRequest): CreateFunctionRequest.AsObject;
  static serializeBinaryToWriter(message: CreateFunctionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateFunctionRequest;
  static deserializeBinaryFromReader(message: CreateFunctionRequest, reader: jspb.BinaryReader): CreateFunctionRequest;
}

export namespace CreateFunctionRequest {
  export type AsObject = {
    pb_function?: FunctionDefinition.AsObject,
  }
}

export class CreateFunctionResponse extends jspb.Message {
  getFunction(): FunctionDefinition | undefined;
  setFunction(value?: FunctionDefinition): CreateFunctionResponse;
  hasFunction(): boolean;
  clearFunction(): CreateFunctionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateFunctionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateFunctionResponse): CreateFunctionResponse.AsObject;
  static serializeBinaryToWriter(message: CreateFunctionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateFunctionResponse;
  static deserializeBinaryFromReader(message: CreateFunctionResponse, reader: jspb.BinaryReader): CreateFunctionResponse;
}

export namespace CreateFunctionResponse {
  export type AsObject = {
    pb_function?: FunctionDefinition.AsObject,
  }
}

export class UpdateFunctionRequest extends jspb.Message {
  getId(): string;
  setId(value: string): UpdateFunctionRequest;

  getFunction(): FunctionDefinition | undefined;
  setFunction(value?: FunctionDefinition): UpdateFunctionRequest;
  hasFunction(): boolean;
  clearFunction(): UpdateFunctionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFunctionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFunctionRequest): UpdateFunctionRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateFunctionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFunctionRequest;
  static deserializeBinaryFromReader(message: UpdateFunctionRequest, reader: jspb.BinaryReader): UpdateFunctionRequest;
}

export namespace UpdateFunctionRequest {
  export type AsObject = {
    id: string,
    pb_function?: FunctionDefinition.AsObject,
  }
}

export class UpdateFunctionResponse extends jspb.Message {
  getFunction(): FunctionDefinition | undefined;
  setFunction(value?: FunctionDefinition): UpdateFunctionResponse;
  hasFunction(): boolean;
  clearFunction(): UpdateFunctionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFunctionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFunctionResponse): UpdateFunctionResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateFunctionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFunctionResponse;
  static deserializeBinaryFromReader(message: UpdateFunctionResponse, reader: jspb.BinaryReader): UpdateFunctionResponse;
}

export namespace UpdateFunctionResponse {
  export type AsObject = {
    pb_function?: FunctionDefinition.AsObject,
  }
}

export class DeleteFunctionRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteFunctionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteFunctionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteFunctionRequest): DeleteFunctionRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteFunctionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteFunctionRequest;
  static deserializeBinaryFromReader(message: DeleteFunctionRequest, reader: jspb.BinaryReader): DeleteFunctionRequest;
}

export namespace DeleteFunctionRequest {
  export type AsObject = {
    id: string,
  }
}

export class DeleteFunctionResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): DeleteFunctionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteFunctionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteFunctionResponse): DeleteFunctionResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteFunctionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteFunctionResponse;
  static deserializeBinaryFromReader(message: DeleteFunctionResponse, reader: jspb.BinaryReader): DeleteFunctionResponse;
}

export namespace DeleteFunctionResponse {
  export type AsObject = {
    message: string,
  }
}

export class TestFunctionRequest extends jspb.Message {
  getFunctionId(): string;
  setFunctionId(value: string): TestFunctionRequest;

  getArguments(): google_protobuf_struct_pb.Struct | undefined;
  setArguments(value?: google_protobuf_struct_pb.Struct): TestFunctionRequest;
  hasArguments(): boolean;
  clearArguments(): TestFunctionRequest;

  getUseMockData(): boolean;
  setUseMockData(value: boolean): TestFunctionRequest;

  getTimeoutMs(): number;
  setTimeoutMs(value: number): TestFunctionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TestFunctionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TestFunctionRequest): TestFunctionRequest.AsObject;
  static serializeBinaryToWriter(message: TestFunctionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TestFunctionRequest;
  static deserializeBinaryFromReader(message: TestFunctionRequest, reader: jspb.BinaryReader): TestFunctionRequest;
}

export namespace TestFunctionRequest {
  export type AsObject = {
    functionId: string,
    arguments?: google_protobuf_struct_pb.Struct.AsObject,
    useMockData: boolean,
    timeoutMs: number,
  }
}

export class TestFunctionResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): TestFunctionResponse;

  getUsedMockData(): boolean;
  setUsedMockData(value: boolean): TestFunctionResponse;

  getExecutionTimeMs(): number;
  setExecutionTimeMs(value: number): TestFunctionResponse;

  getResponse(): google_protobuf_struct_pb.Struct | undefined;
  setResponse(value?: google_protobuf_struct_pb.Struct): TestFunctionResponse;
  hasResponse(): boolean;
  clearResponse(): TestFunctionResponse;

  getErrorMessage(): string;
  setErrorMessage(value: string): TestFunctionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TestFunctionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TestFunctionResponse): TestFunctionResponse.AsObject;
  static serializeBinaryToWriter(message: TestFunctionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TestFunctionResponse;
  static deserializeBinaryFromReader(message: TestFunctionResponse, reader: jspb.BinaryReader): TestFunctionResponse;
}

export namespace TestFunctionResponse {
  export type AsObject = {
    success: boolean,
    usedMockData: boolean,
    executionTimeMs: number,
    response?: google_protobuf_struct_pb.Struct.AsObject,
    errorMessage: string,
  }
}

export class GetDatabaseStatsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDatabaseStatsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDatabaseStatsRequest): GetDatabaseStatsRequest.AsObject;
  static serializeBinaryToWriter(message: GetDatabaseStatsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDatabaseStatsRequest;
  static deserializeBinaryFromReader(message: GetDatabaseStatsRequest, reader: jspb.BinaryReader): GetDatabaseStatsRequest;
}

export namespace GetDatabaseStatsRequest {
  export type AsObject = {
  }
}

export class GetDatabaseStatsResponse extends jspb.Message {
  getTotalExecutionRuns(): number;
  setTotalExecutionRuns(value: number): GetDatabaseStatsResponse;

  getTotalApiRequests(): number;
  setTotalApiRequests(value: number): GetDatabaseStatsResponse;

  getTotalApiResponses(): number;
  setTotalApiResponses(value: number): GetDatabaseStatsResponse;

  getTotalFunctionCalls(): number;
  setTotalFunctionCalls(value: number): GetDatabaseStatsResponse;

  getAvgResponseTime(): number;
  setAvgResponseTime(value: number): GetDatabaseStatsResponse;

  getSuccessRate(): number;
  setSuccessRate(value: number): GetDatabaseStatsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDatabaseStatsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDatabaseStatsResponse): GetDatabaseStatsResponse.AsObject;
  static serializeBinaryToWriter(message: GetDatabaseStatsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDatabaseStatsResponse;
  static deserializeBinaryFromReader(message: GetDatabaseStatsResponse, reader: jspb.BinaryReader): GetDatabaseStatsResponse;
}

export namespace GetDatabaseStatsResponse {
  export type AsObject = {
    totalExecutionRuns: number,
    totalApiRequests: number,
    totalApiResponses: number,
    totalFunctionCalls: number,
    avgResponseTime: number,
    successRate: number,
  }
}

export class ListDatabaseTablesRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDatabaseTablesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListDatabaseTablesRequest): ListDatabaseTablesRequest.AsObject;
  static serializeBinaryToWriter(message: ListDatabaseTablesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDatabaseTablesRequest;
  static deserializeBinaryFromReader(message: ListDatabaseTablesRequest, reader: jspb.BinaryReader): ListDatabaseTablesRequest;
}

export namespace ListDatabaseTablesRequest {
  export type AsObject = {
  }
}

export class ListDatabaseTablesResponse extends jspb.Message {
  getTablesList(): Array<string>;
  setTablesList(value: Array<string>): ListDatabaseTablesResponse;
  clearTablesList(): ListDatabaseTablesResponse;
  addTables(value: string, index?: number): ListDatabaseTablesResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListDatabaseTablesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListDatabaseTablesResponse): ListDatabaseTablesResponse.AsObject;
  static serializeBinaryToWriter(message: ListDatabaseTablesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListDatabaseTablesResponse;
  static deserializeBinaryFromReader(message: ListDatabaseTablesResponse, reader: jspb.BinaryReader): ListDatabaseTablesResponse;
}

export namespace ListDatabaseTablesResponse {
  export type AsObject = {
    tablesList: Array<string>,
  }
}

export class GetTableDataRequest extends jspb.Message {
  getTableName(): string;
  setTableName(value: string): GetTableDataRequest;

  getLimit(): number;
  setLimit(value: number): GetTableDataRequest;

  getOffset(): number;
  setOffset(value: number): GetTableDataRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTableDataRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTableDataRequest): GetTableDataRequest.AsObject;
  static serializeBinaryToWriter(message: GetTableDataRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTableDataRequest;
  static deserializeBinaryFromReader(message: GetTableDataRequest, reader: jspb.BinaryReader): GetTableDataRequest;
}

export namespace GetTableDataRequest {
  export type AsObject = {
    tableName: string,
    limit: number,
    offset: number,
  }
}

export class GetTableDataResponse extends jspb.Message {
  getTableName(): string;
  setTableName(value: string): GetTableDataResponse;

  getColumnsList(): Array<string>;
  setColumnsList(value: Array<string>): GetTableDataResponse;
  clearColumnsList(): GetTableDataResponse;
  addColumns(value: string, index?: number): GetTableDataResponse;

  getRowsList(): Array<google_protobuf_struct_pb.ListValue>;
  setRowsList(value: Array<google_protobuf_struct_pb.ListValue>): GetTableDataResponse;
  clearRowsList(): GetTableDataResponse;
  addRows(value?: google_protobuf_struct_pb.ListValue, index?: number): google_protobuf_struct_pb.ListValue;

  getTotalRows(): number;
  setTotalRows(value: number): GetTableDataResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTableDataResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTableDataResponse): GetTableDataResponse.AsObject;
  static serializeBinaryToWriter(message: GetTableDataResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTableDataResponse;
  static deserializeBinaryFromReader(message: GetTableDataResponse, reader: jspb.BinaryReader): GetTableDataResponse;
}

export namespace GetTableDataResponse {
  export type AsObject = {
    tableName: string,
    columnsList: Array<string>,
    rowsList: Array<google_protobuf_struct_pb.ListValue.AsObject>,
    totalRows: number,
  }
}

export class HealthRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HealthRequest.AsObject;
  static toObject(includeInstance: boolean, msg: HealthRequest): HealthRequest.AsObject;
  static serializeBinaryToWriter(message: HealthRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HealthRequest;
  static deserializeBinaryFromReader(message: HealthRequest, reader: jspb.BinaryReader): HealthRequest;
}

export namespace HealthRequest {
  export type AsObject = {
  }
}

export class HealthResponse extends jspb.Message {
  getStatus(): string;
  setStatus(value: string): HealthResponse;

  getVersion(): string;
  setVersion(value: string): HealthResponse;

  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): HealthResponse;
  hasTimestamp(): boolean;
  clearTimestamp(): HealthResponse;

  getDatabase(): boolean;
  setDatabase(value: boolean): HealthResponse;

  getGeminiApi(): boolean;
  setGeminiApi(value: boolean): HealthResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HealthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: HealthResponse): HealthResponse.AsObject;
  static serializeBinaryToWriter(message: HealthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HealthResponse;
  static deserializeBinaryFromReader(message: HealthResponse, reader: jspb.BinaryReader): HealthResponse;
}

export namespace HealthResponse {
  export type AsObject = {
    status: string,
    version: string,
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    database: boolean,
    geminiApi: boolean,
  }
}

export class ExecutionRun extends jspb.Message {
  getId(): string;
  setId(value: string): ExecutionRun;

  getUserId(): string;
  setUserId(value: string): ExecutionRun;

  getName(): string;
  setName(value: string): ExecutionRun;

  getDescription(): string;
  setDescription(value: string): ExecutionRun;

  getEnableFunctionCalling(): boolean;
  setEnableFunctionCalling(value: boolean): ExecutionRun;

  getStatus(): string;
  setStatus(value: string): ExecutionRun;

  getErrorMessage(): string;
  setErrorMessage(value: string): ExecutionRun;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): ExecutionRun;
  hasCreatedAt(): boolean;
  clearCreatedAt(): ExecutionRun;

  getUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): ExecutionRun;
  hasUpdatedAt(): boolean;
  clearUpdatedAt(): ExecutionRun;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecutionRun.AsObject;
  static toObject(includeInstance: boolean, msg: ExecutionRun): ExecutionRun.AsObject;
  static serializeBinaryToWriter(message: ExecutionRun, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecutionRun;
  static deserializeBinaryFromReader(message: ExecutionRun, reader: jspb.BinaryReader): ExecutionRun;
}

export namespace ExecutionRun {
  export type AsObject = {
    id: string,
    userId: string,
    name: string,
    description: string,
    enableFunctionCalling: boolean,
    status: string,
    errorMessage: string,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    updatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class APIConfiguration extends jspb.Message {
  getId(): string;
  setId(value: string): APIConfiguration;

  getExecutionRunId(): string;
  setExecutionRunId(value: string): APIConfiguration;

  getVariationName(): string;
  setVariationName(value: string): APIConfiguration;

  getModelName(): string;
  setModelName(value: string): APIConfiguration;

  getSystemPrompt(): string;
  setSystemPrompt(value: string): APIConfiguration;

  getTemperature(): number;
  setTemperature(value: number): APIConfiguration;

  getMaxTokens(): number;
  setMaxTokens(value: number): APIConfiguration;

  getTopP(): number;
  setTopP(value: number): APIConfiguration;

  getTopK(): number;
  setTopK(value: number): APIConfiguration;

  getSafetySettings(): google_protobuf_struct_pb.Struct | undefined;
  setSafetySettings(value?: google_protobuf_struct_pb.Struct): APIConfiguration;
  hasSafetySettings(): boolean;
  clearSafetySettings(): APIConfiguration;

  getGenerationConfig(): google_protobuf_struct_pb.Struct | undefined;
  setGenerationConfig(value?: google_protobuf_struct_pb.Struct): APIConfiguration;
  hasGenerationConfig(): boolean;
  clearGenerationConfig(): APIConfiguration;

  getToolsList(): Array<Tool>;
  setToolsList(value: Array<Tool>): APIConfiguration;
  clearToolsList(): APIConfiguration;
  addTools(value?: Tool, index?: number): Tool;

  getToolConfig(): google_protobuf_struct_pb.Struct | undefined;
  setToolConfig(value?: google_protobuf_struct_pb.Struct): APIConfiguration;
  hasToolConfig(): boolean;
  clearToolConfig(): APIConfiguration;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): APIConfiguration;
  hasCreatedAt(): boolean;
  clearCreatedAt(): APIConfiguration;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): APIConfiguration.AsObject;
  static toObject(includeInstance: boolean, msg: APIConfiguration): APIConfiguration.AsObject;
  static serializeBinaryToWriter(message: APIConfiguration, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): APIConfiguration;
  static deserializeBinaryFromReader(message: APIConfiguration, reader: jspb.BinaryReader): APIConfiguration;
}

export namespace APIConfiguration {
  export type AsObject = {
    id: string,
    executionRunId: string,
    variationName: string,
    modelName: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
    topP: number,
    topK: number,
    safetySettings?: google_protobuf_struct_pb.Struct.AsObject,
    generationConfig?: google_protobuf_struct_pb.Struct.AsObject,
    toolsList: Array<Tool.AsObject>,
    toolConfig?: google_protobuf_struct_pb.Struct.AsObject,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class Tool extends jspb.Message {
  getName(): string;
  setName(value: string): Tool;

  getDescription(): string;
  setDescription(value: string): Tool;

  getParameters(): google_protobuf_struct_pb.Struct | undefined;
  setParameters(value?: google_protobuf_struct_pb.Struct): Tool;
  hasParameters(): boolean;
  clearParameters(): Tool;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Tool.AsObject;
  static toObject(includeInstance: boolean, msg: Tool): Tool.AsObject;
  static serializeBinaryToWriter(message: Tool, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Tool;
  static deserializeBinaryFromReader(message: Tool, reader: jspb.BinaryReader): Tool;
}

export namespace Tool {
  export type AsObject = {
    name: string,
    description: string,
    parameters?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class FunctionDefinition extends jspb.Message {
  getId(): string;
  setId(value: string): FunctionDefinition;

  getUserId(): string;
  setUserId(value: string): FunctionDefinition;

  getName(): string;
  setName(value: string): FunctionDefinition;

  getDisplayName(): string;
  setDisplayName(value: string): FunctionDefinition;

  getDescription(): string;
  setDescription(value: string): FunctionDefinition;

  getParametersSchema(): google_protobuf_struct_pb.Struct | undefined;
  setParametersSchema(value?: google_protobuf_struct_pb.Struct): FunctionDefinition;
  hasParametersSchema(): boolean;
  clearParametersSchema(): FunctionDefinition;

  getMockResponse(): google_protobuf_struct_pb.Struct | undefined;
  setMockResponse(value?: google_protobuf_struct_pb.Struct): FunctionDefinition;
  hasMockResponse(): boolean;
  clearMockResponse(): FunctionDefinition;

  getEndpointUrl(): string;
  setEndpointUrl(value: string): FunctionDefinition;

  getHttpMethod(): string;
  setHttpMethod(value: string): FunctionDefinition;

  getHeaders(): google_protobuf_struct_pb.Struct | undefined;
  setHeaders(value?: google_protobuf_struct_pb.Struct): FunctionDefinition;
  hasHeaders(): boolean;
  clearHeaders(): FunctionDefinition;

  getAuthConfig(): google_protobuf_struct_pb.Struct | undefined;
  setAuthConfig(value?: google_protobuf_struct_pb.Struct): FunctionDefinition;
  hasAuthConfig(): boolean;
  clearAuthConfig(): FunctionDefinition;

  getIsActive(): boolean;
  setIsActive(value: boolean): FunctionDefinition;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): FunctionDefinition;
  hasCreatedAt(): boolean;
  clearCreatedAt(): FunctionDefinition;

  getUpdatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setUpdatedAt(value?: google_protobuf_timestamp_pb.Timestamp): FunctionDefinition;
  hasUpdatedAt(): boolean;
  clearUpdatedAt(): FunctionDefinition;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FunctionDefinition.AsObject;
  static toObject(includeInstance: boolean, msg: FunctionDefinition): FunctionDefinition.AsObject;
  static serializeBinaryToWriter(message: FunctionDefinition, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FunctionDefinition;
  static deserializeBinaryFromReader(message: FunctionDefinition, reader: jspb.BinaryReader): FunctionDefinition;
}

export namespace FunctionDefinition {
  export type AsObject = {
    id: string,
    userId: string,
    name: string,
    displayName: string,
    description: string,
    parametersSchema?: google_protobuf_struct_pb.Struct.AsObject,
    mockResponse?: google_protobuf_struct_pb.Struct.AsObject,
    endpointUrl: string,
    httpMethod: string,
    headers?: google_protobuf_struct_pb.Struct.AsObject,
    authConfig?: google_protobuf_struct_pb.Struct.AsObject,
    isActive: boolean,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    updatedAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class APIRequest extends jspb.Message {
  getId(): string;
  setId(value: string): APIRequest;

  getExecutionRunId(): string;
  setExecutionRunId(value: string): APIRequest;

  getConfigurationId(): string;
  setConfigurationId(value: string): APIRequest;

  getRequestType(): string;
  setRequestType(value: string): APIRequest;

  getPrompt(): string;
  setPrompt(value: string): APIRequest;

  getContext(): string;
  setContext(value: string): APIRequest;

  getFunctionName(): string;
  setFunctionName(value: string): APIRequest;

  getFunctionParameters(): google_protobuf_struct_pb.Struct | undefined;
  setFunctionParameters(value?: google_protobuf_struct_pb.Struct): APIRequest;
  hasFunctionParameters(): boolean;
  clearFunctionParameters(): APIRequest;

  getRequestHeaders(): google_protobuf_struct_pb.Struct | undefined;
  setRequestHeaders(value?: google_protobuf_struct_pb.Struct): APIRequest;
  hasRequestHeaders(): boolean;
  clearRequestHeaders(): APIRequest;

  getRequestBody(): google_protobuf_struct_pb.Struct | undefined;
  setRequestBody(value?: google_protobuf_struct_pb.Struct): APIRequest;
  hasRequestBody(): boolean;
  clearRequestBody(): APIRequest;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): APIRequest;
  hasCreatedAt(): boolean;
  clearCreatedAt(): APIRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): APIRequest.AsObject;
  static toObject(includeInstance: boolean, msg: APIRequest): APIRequest.AsObject;
  static serializeBinaryToWriter(message: APIRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): APIRequest;
  static deserializeBinaryFromReader(message: APIRequest, reader: jspb.BinaryReader): APIRequest;
}

export namespace APIRequest {
  export type AsObject = {
    id: string,
    executionRunId: string,
    configurationId: string,
    requestType: string,
    prompt: string,
    context: string,
    functionName: string,
    functionParameters?: google_protobuf_struct_pb.Struct.AsObject,
    requestHeaders?: google_protobuf_struct_pb.Struct.AsObject,
    requestBody?: google_protobuf_struct_pb.Struct.AsObject,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class APIResponse extends jspb.Message {
  getId(): string;
  setId(value: string): APIResponse;

  getRequestId(): string;
  setRequestId(value: string): APIResponse;

  getResponseStatus(): string;
  setResponseStatus(value: string): APIResponse;

  getResponseText(): string;
  setResponseText(value: string): APIResponse;

  getFunctionCallResponse(): google_protobuf_struct_pb.Struct | undefined;
  setFunctionCallResponse(value?: google_protobuf_struct_pb.Struct): APIResponse;
  hasFunctionCallResponse(): boolean;
  clearFunctionCallResponse(): APIResponse;

  getUsageMetadata(): google_protobuf_struct_pb.Struct | undefined;
  setUsageMetadata(value?: google_protobuf_struct_pb.Struct): APIResponse;
  hasUsageMetadata(): boolean;
  clearUsageMetadata(): APIResponse;

  getSafetyRatings(): google_protobuf_struct_pb.Struct | undefined;
  setSafetyRatings(value?: google_protobuf_struct_pb.Struct): APIResponse;
  hasSafetyRatings(): boolean;
  clearSafetyRatings(): APIResponse;

  getFinishReason(): string;
  setFinishReason(value: string): APIResponse;

  getErrorMessage(): string;
  setErrorMessage(value: string): APIResponse;

  getResponseTimeMs(): number;
  setResponseTimeMs(value: number): APIResponse;

  getResponseHeaders(): google_protobuf_struct_pb.Struct | undefined;
  setResponseHeaders(value?: google_protobuf_struct_pb.Struct): APIResponse;
  hasResponseHeaders(): boolean;
  clearResponseHeaders(): APIResponse;

  getResponseBody(): google_protobuf_struct_pb.Struct | undefined;
  setResponseBody(value?: google_protobuf_struct_pb.Struct): APIResponse;
  hasResponseBody(): boolean;
  clearResponseBody(): APIResponse;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): APIResponse;
  hasCreatedAt(): boolean;
  clearCreatedAt(): APIResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): APIResponse.AsObject;
  static toObject(includeInstance: boolean, msg: APIResponse): APIResponse.AsObject;
  static serializeBinaryToWriter(message: APIResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): APIResponse;
  static deserializeBinaryFromReader(message: APIResponse, reader: jspb.BinaryReader): APIResponse;
}

export namespace APIResponse {
  export type AsObject = {
    id: string,
    requestId: string,
    responseStatus: string,
    responseText: string,
    functionCallResponse?: google_protobuf_struct_pb.Struct.AsObject,
    usageMetadata?: google_protobuf_struct_pb.Struct.AsObject,
    safetyRatings?: google_protobuf_struct_pb.Struct.AsObject,
    finishReason: string,
    errorMessage: string,
    responseTimeMs: number,
    responseHeaders?: google_protobuf_struct_pb.Struct.AsObject,
    responseBody?: google_protobuf_struct_pb.Struct.AsObject,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class FunctionCall extends jspb.Message {
  getId(): string;
  setId(value: string): FunctionCall;

  getRequestId(): string;
  setRequestId(value: string): FunctionCall;

  getFunctionName(): string;
  setFunctionName(value: string): FunctionCall;

  getFunctionArguments(): google_protobuf_struct_pb.Struct | undefined;
  setFunctionArguments(value?: google_protobuf_struct_pb.Struct): FunctionCall;
  hasFunctionArguments(): boolean;
  clearFunctionArguments(): FunctionCall;

  getFunctionResponse(): google_protobuf_struct_pb.Struct | undefined;
  setFunctionResponse(value?: google_protobuf_struct_pb.Struct): FunctionCall;
  hasFunctionResponse(): boolean;
  clearFunctionResponse(): FunctionCall;

  getExecutionStatus(): string;
  setExecutionStatus(value: string): FunctionCall;

  getExecutionTimeMs(): number;
  setExecutionTimeMs(value: number): FunctionCall;

  getErrorDetails(): string;
  setErrorDetails(value: string): FunctionCall;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): FunctionCall;
  hasCreatedAt(): boolean;
  clearCreatedAt(): FunctionCall;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FunctionCall.AsObject;
  static toObject(includeInstance: boolean, msg: FunctionCall): FunctionCall.AsObject;
  static serializeBinaryToWriter(message: FunctionCall, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FunctionCall;
  static deserializeBinaryFromReader(message: FunctionCall, reader: jspb.BinaryReader): FunctionCall;
}

export namespace FunctionCall {
  export type AsObject = {
    id: string,
    requestId: string,
    functionName: string,
    functionArguments?: google_protobuf_struct_pb.Struct.AsObject,
    functionResponse?: google_protobuf_struct_pb.Struct.AsObject,
    executionStatus: string,
    executionTimeMs: number,
    errorDetails: string,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ExecutionResult extends jspb.Message {
  getExecutionRun(): ExecutionRun | undefined;
  setExecutionRun(value?: ExecutionRun): ExecutionResult;
  hasExecutionRun(): boolean;
  clearExecutionRun(): ExecutionResult;

  getResultsList(): Array<VariationResult>;
  setResultsList(value: Array<VariationResult>): ExecutionResult;
  clearResultsList(): ExecutionResult;
  addResults(value?: VariationResult, index?: number): VariationResult;

  getComparison(): ComparisonResult | undefined;
  setComparison(value?: ComparisonResult): ExecutionResult;
  hasComparison(): boolean;
  clearComparison(): ExecutionResult;

  getTotalTime(): number;
  setTotalTime(value: number): ExecutionResult;

  getSuccessCount(): number;
  setSuccessCount(value: number): ExecutionResult;

  getErrorCount(): number;
  setErrorCount(value: number): ExecutionResult;

  getLogsList(): Array<ExecutionLog>;
  setLogsList(value: Array<ExecutionLog>): ExecutionResult;
  clearLogsList(): ExecutionResult;
  addLogs(value?: ExecutionLog, index?: number): ExecutionLog;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecutionResult.AsObject;
  static toObject(includeInstance: boolean, msg: ExecutionResult): ExecutionResult.AsObject;
  static serializeBinaryToWriter(message: ExecutionResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecutionResult;
  static deserializeBinaryFromReader(message: ExecutionResult, reader: jspb.BinaryReader): ExecutionResult;
}

export namespace ExecutionResult {
  export type AsObject = {
    executionRun?: ExecutionRun.AsObject,
    resultsList: Array<VariationResult.AsObject>,
    comparison?: ComparisonResult.AsObject,
    totalTime: number,
    successCount: number,
    errorCount: number,
    logsList: Array<ExecutionLog.AsObject>,
  }
}

export class VariationResult extends jspb.Message {
  getConfiguration(): APIConfiguration | undefined;
  setConfiguration(value?: APIConfiguration): VariationResult;
  hasConfiguration(): boolean;
  clearConfiguration(): VariationResult;

  getRequest(): APIRequest | undefined;
  setRequest(value?: APIRequest): VariationResult;
  hasRequest(): boolean;
  clearRequest(): VariationResult;

  getResponse(): APIResponse | undefined;
  setResponse(value?: APIResponse): VariationResult;
  hasResponse(): boolean;
  clearResponse(): VariationResult;

  getFunctionCallsList(): Array<FunctionCall>;
  setFunctionCallsList(value: Array<FunctionCall>): VariationResult;
  clearFunctionCallsList(): VariationResult;
  addFunctionCalls(value?: FunctionCall, index?: number): FunctionCall;

  getExecutionTime(): number;
  setExecutionTime(value: number): VariationResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VariationResult.AsObject;
  static toObject(includeInstance: boolean, msg: VariationResult): VariationResult.AsObject;
  static serializeBinaryToWriter(message: VariationResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VariationResult;
  static deserializeBinaryFromReader(message: VariationResult, reader: jspb.BinaryReader): VariationResult;
}

export namespace VariationResult {
  export type AsObject = {
    configuration?: APIConfiguration.AsObject,
    request?: APIRequest.AsObject,
    response?: APIResponse.AsObject,
    functionCallsList: Array<FunctionCall.AsObject>,
    executionTime: number,
  }
}

export class ComparisonResult extends jspb.Message {
  getId(): string;
  setId(value: string): ComparisonResult;

  getExecutionRunId(): string;
  setExecutionRunId(value: string): ComparisonResult;

  getComparisonType(): string;
  setComparisonType(value: string): ComparisonResult;

  getMetricName(): string;
  setMetricName(value: string): ComparisonResult;

  getConfigurationScores(): google_protobuf_struct_pb.Struct | undefined;
  setConfigurationScores(value?: google_protobuf_struct_pb.Struct): ComparisonResult;
  hasConfigurationScores(): boolean;
  clearConfigurationScores(): ComparisonResult;

  getBestConfigurationId(): string;
  setBestConfigurationId(value: string): ComparisonResult;

  getBestConfiguration(): APIConfiguration | undefined;
  setBestConfiguration(value?: APIConfiguration): ComparisonResult;
  hasBestConfiguration(): boolean;
  clearBestConfiguration(): ComparisonResult;

  getAllConfigurationsList(): Array<APIConfiguration>;
  setAllConfigurationsList(value: Array<APIConfiguration>): ComparisonResult;
  clearAllConfigurationsList(): ComparisonResult;
  addAllConfigurations(value?: APIConfiguration, index?: number): APIConfiguration;

  getAnalysisNotes(): string;
  setAnalysisNotes(value: string): ComparisonResult;

  getCreatedAt(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedAt(value?: google_protobuf_timestamp_pb.Timestamp): ComparisonResult;
  hasCreatedAt(): boolean;
  clearCreatedAt(): ComparisonResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ComparisonResult.AsObject;
  static toObject(includeInstance: boolean, msg: ComparisonResult): ComparisonResult.AsObject;
  static serializeBinaryToWriter(message: ComparisonResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ComparisonResult;
  static deserializeBinaryFromReader(message: ComparisonResult, reader: jspb.BinaryReader): ComparisonResult;
}

export namespace ComparisonResult {
  export type AsObject = {
    id: string,
    executionRunId: string,
    comparisonType: string,
    metricName: string,
    configurationScores?: google_protobuf_struct_pb.Struct.AsObject,
    bestConfigurationId: string,
    bestConfiguration?: APIConfiguration.AsObject,
    allConfigurationsList: Array<APIConfiguration.AsObject>,
    analysisNotes: string,
    createdAt?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ExecutionLog extends jspb.Message {
  getId(): string;
  setId(value: string): ExecutionLog;

  getExecutionRunId(): string;
  setExecutionRunId(value: string): ExecutionLog;

  getConfigurationId(): string;
  setConfigurationId(value: string): ExecutionLog;

  getRequestId(): string;
  setRequestId(value: string): ExecutionLog;

  getLogLevel(): string;
  setLogLevel(value: string): ExecutionLog;

  getLogCategory(): string;
  setLogCategory(value: string): ExecutionLog;

  getMessage(): string;
  setMessage(value: string): ExecutionLog;

  getDetails(): google_protobuf_struct_pb.Struct | undefined;
  setDetails(value?: google_protobuf_struct_pb.Struct): ExecutionLog;
  hasDetails(): boolean;
  clearDetails(): ExecutionLog;

  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): ExecutionLog;
  hasTimestamp(): boolean;
  clearTimestamp(): ExecutionLog;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecutionLog.AsObject;
  static toObject(includeInstance: boolean, msg: ExecutionLog): ExecutionLog.AsObject;
  static serializeBinaryToWriter(message: ExecutionLog, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecutionLog;
  static deserializeBinaryFromReader(message: ExecutionLog, reader: jspb.BinaryReader): ExecutionLog;
}

export namespace ExecutionLog {
  export type AsObject = {
    id: string,
    executionRunId: string,
    configurationId: string,
    requestId: string,
    logLevel: string,
    logCategory: string,
    message: string,
    details?: google_protobuf_struct_pb.Struct.AsObject,
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ComparisonConfig extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): ComparisonConfig;

  getMetricsList(): Array<string>;
  setMetricsList(value: Array<string>): ComparisonConfig;
  clearMetricsList(): ComparisonConfig;
  addMetrics(value: string, index?: number): ComparisonConfig;

  getCustomRulesList(): Array<string>;
  setCustomRulesList(value: Array<string>): ComparisonConfig;
  clearCustomRulesList(): ComparisonConfig;
  addCustomRules(value: string, index?: number): ComparisonConfig;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ComparisonConfig.AsObject;
  static toObject(includeInstance: boolean, msg: ComparisonConfig): ComparisonConfig.AsObject;
  static serializeBinaryToWriter(message: ComparisonConfig, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ComparisonConfig;
  static deserializeBinaryFromReader(message: ComparisonConfig, reader: jspb.BinaryReader): ComparisonConfig;
}

export namespace ComparisonConfig {
  export type AsObject = {
    enabled: boolean,
    metricsList: Array<string>,
    customRulesList: Array<string>,
  }
}

