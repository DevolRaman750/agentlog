// source: gogent.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
goog.object.extend(proto, google_protobuf_timestamp_pb);
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
goog.object.extend(proto, google_protobuf_struct_pb);
goog.exportSymbol('proto.gogent.APIConfiguration', null, global);
goog.exportSymbol('proto.gogent.APIRequest', null, global);
goog.exportSymbol('proto.gogent.APIResponse', null, global);
goog.exportSymbol('proto.gogent.ComparisonConfig', null, global);
goog.exportSymbol('proto.gogent.ComparisonResult', null, global);
goog.exportSymbol('proto.gogent.CreateConfigurationRequest', null, global);
goog.exportSymbol('proto.gogent.CreateConfigurationResponse', null, global);
goog.exportSymbol('proto.gogent.CreateFunctionRequest', null, global);
goog.exportSymbol('proto.gogent.CreateFunctionResponse', null, global);
goog.exportSymbol('proto.gogent.CreateTemporaryUserRequest', null, global);
goog.exportSymbol('proto.gogent.CreateTemporaryUserResponse', null, global);
goog.exportSymbol('proto.gogent.DeleteConfigurationRequest', null, global);
goog.exportSymbol('proto.gogent.DeleteConfigurationResponse', null, global);
goog.exportSymbol('proto.gogent.DeleteExecutionRunRequest', null, global);
goog.exportSymbol('proto.gogent.DeleteExecutionRunResponse', null, global);
goog.exportSymbol('proto.gogent.DeleteFunctionRequest', null, global);
goog.exportSymbol('proto.gogent.DeleteFunctionResponse', null, global);
goog.exportSymbol('proto.gogent.ExecuteRequest', null, global);
goog.exportSymbol('proto.gogent.ExecuteResponse', null, global);
goog.exportSymbol('proto.gogent.ExecutionLog', null, global);
goog.exportSymbol('proto.gogent.ExecutionResult', null, global);
goog.exportSymbol('proto.gogent.ExecutionRun', null, global);
goog.exportSymbol('proto.gogent.FunctionCall', null, global);
goog.exportSymbol('proto.gogent.FunctionDefinition', null, global);
goog.exportSymbol('proto.gogent.GetCurrentUserRequest', null, global);
goog.exportSymbol('proto.gogent.GetCurrentUserResponse', null, global);
goog.exportSymbol('proto.gogent.GetDatabaseStatsRequest', null, global);
goog.exportSymbol('proto.gogent.GetDatabaseStatsResponse', null, global);
goog.exportSymbol('proto.gogent.GetExecutionResultRequest', null, global);
goog.exportSymbol('proto.gogent.GetExecutionResultResponse', null, global);
goog.exportSymbol('proto.gogent.GetExecutionStatusRequest', null, global);
goog.exportSymbol('proto.gogent.GetExecutionStatusResponse', null, global);
goog.exportSymbol('proto.gogent.GetFunctionRequest', null, global);
goog.exportSymbol('proto.gogent.GetFunctionResponse', null, global);
goog.exportSymbol('proto.gogent.GetTableDataRequest', null, global);
goog.exportSymbol('proto.gogent.GetTableDataResponse', null, global);
goog.exportSymbol('proto.gogent.HealthRequest', null, global);
goog.exportSymbol('proto.gogent.HealthResponse', null, global);
goog.exportSymbol('proto.gogent.ListConfigurationsRequest', null, global);
goog.exportSymbol('proto.gogent.ListConfigurationsResponse', null, global);
goog.exportSymbol('proto.gogent.ListDatabaseTablesRequest', null, global);
goog.exportSymbol('proto.gogent.ListDatabaseTablesResponse', null, global);
goog.exportSymbol('proto.gogent.ListExecutionRunsRequest', null, global);
goog.exportSymbol('proto.gogent.ListExecutionRunsResponse', null, global);
goog.exportSymbol('proto.gogent.ListFunctionsRequest', null, global);
goog.exportSymbol('proto.gogent.ListFunctionsResponse', null, global);
goog.exportSymbol('proto.gogent.LoginRequest', null, global);
goog.exportSymbol('proto.gogent.LoginResponse', null, global);
goog.exportSymbol('proto.gogent.RegisterRequest', null, global);
goog.exportSymbol('proto.gogent.RegisterResponse', null, global);
goog.exportSymbol('proto.gogent.SaveTemporaryAccountRequest', null, global);
goog.exportSymbol('proto.gogent.SaveTemporaryAccountResponse', null, global);
goog.exportSymbol('proto.gogent.TestFunctionRequest', null, global);
goog.exportSymbol('proto.gogent.TestFunctionResponse', null, global);
goog.exportSymbol('proto.gogent.Tool', null, global);
goog.exportSymbol('proto.gogent.UpdateConfigurationRequest', null, global);
goog.exportSymbol('proto.gogent.UpdateConfigurationResponse', null, global);
goog.exportSymbol('proto.gogent.UpdateFunctionRequest', null, global);
goog.exportSymbol('proto.gogent.UpdateFunctionResponse', null, global);
goog.exportSymbol('proto.gogent.User', null, global);
goog.exportSymbol('proto.gogent.VariationResult', null, global);
goog.exportSymbol('proto.gogent.VerifyEmailRequest', null, global);
goog.exportSymbol('proto.gogent.VerifyEmailResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.User = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.User, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.User.displayName = 'proto.gogent.User';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.LoginRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.LoginRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.LoginRequest.displayName = 'proto.gogent.LoginRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.LoginResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.LoginResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.LoginResponse.displayName = 'proto.gogent.LoginResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.RegisterRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.RegisterRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.RegisterRequest.displayName = 'proto.gogent.RegisterRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.RegisterResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.RegisterResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.RegisterResponse.displayName = 'proto.gogent.RegisterResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateTemporaryUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateTemporaryUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateTemporaryUserRequest.displayName = 'proto.gogent.CreateTemporaryUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateTemporaryUserResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateTemporaryUserResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateTemporaryUserResponse.displayName = 'proto.gogent.CreateTemporaryUserResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.SaveTemporaryAccountRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.SaveTemporaryAccountRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.SaveTemporaryAccountRequest.displayName = 'proto.gogent.SaveTemporaryAccountRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.SaveTemporaryAccountResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.SaveTemporaryAccountResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.SaveTemporaryAccountResponse.displayName = 'proto.gogent.SaveTemporaryAccountResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.VerifyEmailRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.VerifyEmailRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.VerifyEmailRequest.displayName = 'proto.gogent.VerifyEmailRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.VerifyEmailResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.VerifyEmailResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.VerifyEmailResponse.displayName = 'proto.gogent.VerifyEmailResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetCurrentUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetCurrentUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetCurrentUserRequest.displayName = 'proto.gogent.GetCurrentUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetCurrentUserResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetCurrentUserResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetCurrentUserResponse.displayName = 'proto.gogent.GetCurrentUserResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ExecuteRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ExecuteRequest.repeatedFields_, null);
};
goog.inherits(proto.gogent.ExecuteRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ExecuteRequest.displayName = 'proto.gogent.ExecuteRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ExecuteResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ExecuteResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ExecuteResponse.displayName = 'proto.gogent.ExecuteResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetExecutionStatusRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetExecutionStatusRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetExecutionStatusRequest.displayName = 'proto.gogent.GetExecutionStatusRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetExecutionStatusResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetExecutionStatusResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetExecutionStatusResponse.displayName = 'proto.gogent.GetExecutionStatusResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetExecutionResultRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetExecutionResultRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetExecutionResultRequest.displayName = 'proto.gogent.GetExecutionResultRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetExecutionResultResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetExecutionResultResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetExecutionResultResponse.displayName = 'proto.gogent.GetExecutionResultResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListExecutionRunsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ListExecutionRunsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListExecutionRunsRequest.displayName = 'proto.gogent.ListExecutionRunsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListExecutionRunsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ListExecutionRunsResponse.repeatedFields_, null);
};
goog.inherits(proto.gogent.ListExecutionRunsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListExecutionRunsResponse.displayName = 'proto.gogent.ListExecutionRunsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteExecutionRunRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteExecutionRunRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteExecutionRunRequest.displayName = 'proto.gogent.DeleteExecutionRunRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteExecutionRunResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteExecutionRunResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteExecutionRunResponse.displayName = 'proto.gogent.DeleteExecutionRunResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListConfigurationsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ListConfigurationsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListConfigurationsRequest.displayName = 'proto.gogent.ListConfigurationsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListConfigurationsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ListConfigurationsResponse.repeatedFields_, null);
};
goog.inherits(proto.gogent.ListConfigurationsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListConfigurationsResponse.displayName = 'proto.gogent.ListConfigurationsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateConfigurationRequest.displayName = 'proto.gogent.CreateConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateConfigurationResponse.displayName = 'proto.gogent.CreateConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.UpdateConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.UpdateConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.UpdateConfigurationRequest.displayName = 'proto.gogent.UpdateConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.UpdateConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.UpdateConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.UpdateConfigurationResponse.displayName = 'proto.gogent.UpdateConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteConfigurationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteConfigurationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteConfigurationRequest.displayName = 'proto.gogent.DeleteConfigurationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteConfigurationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteConfigurationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteConfigurationResponse.displayName = 'proto.gogent.DeleteConfigurationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListFunctionsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ListFunctionsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListFunctionsRequest.displayName = 'proto.gogent.ListFunctionsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListFunctionsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ListFunctionsResponse.repeatedFields_, null);
};
goog.inherits(proto.gogent.ListFunctionsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListFunctionsResponse.displayName = 'proto.gogent.ListFunctionsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetFunctionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetFunctionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetFunctionRequest.displayName = 'proto.gogent.GetFunctionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetFunctionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetFunctionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetFunctionResponse.displayName = 'proto.gogent.GetFunctionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateFunctionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateFunctionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateFunctionRequest.displayName = 'proto.gogent.CreateFunctionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.CreateFunctionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.CreateFunctionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.CreateFunctionResponse.displayName = 'proto.gogent.CreateFunctionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.UpdateFunctionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.UpdateFunctionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.UpdateFunctionRequest.displayName = 'proto.gogent.UpdateFunctionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.UpdateFunctionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.UpdateFunctionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.UpdateFunctionResponse.displayName = 'proto.gogent.UpdateFunctionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteFunctionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteFunctionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteFunctionRequest.displayName = 'proto.gogent.DeleteFunctionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.DeleteFunctionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.DeleteFunctionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.DeleteFunctionResponse.displayName = 'proto.gogent.DeleteFunctionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.TestFunctionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.TestFunctionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.TestFunctionRequest.displayName = 'proto.gogent.TestFunctionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.TestFunctionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.TestFunctionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.TestFunctionResponse.displayName = 'proto.gogent.TestFunctionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetDatabaseStatsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetDatabaseStatsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetDatabaseStatsRequest.displayName = 'proto.gogent.GetDatabaseStatsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetDatabaseStatsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetDatabaseStatsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetDatabaseStatsResponse.displayName = 'proto.gogent.GetDatabaseStatsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListDatabaseTablesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ListDatabaseTablesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListDatabaseTablesRequest.displayName = 'proto.gogent.ListDatabaseTablesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ListDatabaseTablesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ListDatabaseTablesResponse.repeatedFields_, null);
};
goog.inherits(proto.gogent.ListDatabaseTablesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ListDatabaseTablesResponse.displayName = 'proto.gogent.ListDatabaseTablesResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetTableDataRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.GetTableDataRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetTableDataRequest.displayName = 'proto.gogent.GetTableDataRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.GetTableDataResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.GetTableDataResponse.repeatedFields_, null);
};
goog.inherits(proto.gogent.GetTableDataResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.GetTableDataResponse.displayName = 'proto.gogent.GetTableDataResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.HealthRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.HealthRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.HealthRequest.displayName = 'proto.gogent.HealthRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.HealthResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.HealthResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.HealthResponse.displayName = 'proto.gogent.HealthResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ExecutionRun = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ExecutionRun, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ExecutionRun.displayName = 'proto.gogent.ExecutionRun';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.APIConfiguration = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.APIConfiguration.repeatedFields_, null);
};
goog.inherits(proto.gogent.APIConfiguration, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.APIConfiguration.displayName = 'proto.gogent.APIConfiguration';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.Tool = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.Tool, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.Tool.displayName = 'proto.gogent.Tool';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.FunctionDefinition = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.FunctionDefinition, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.FunctionDefinition.displayName = 'proto.gogent.FunctionDefinition';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.APIRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.APIRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.APIRequest.displayName = 'proto.gogent.APIRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.APIResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.APIResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.APIResponse.displayName = 'proto.gogent.APIResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.FunctionCall = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.FunctionCall, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.FunctionCall.displayName = 'proto.gogent.FunctionCall';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ExecutionResult = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ExecutionResult.repeatedFields_, null);
};
goog.inherits(proto.gogent.ExecutionResult, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ExecutionResult.displayName = 'proto.gogent.ExecutionResult';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.VariationResult = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.VariationResult.repeatedFields_, null);
};
goog.inherits(proto.gogent.VariationResult, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.VariationResult.displayName = 'proto.gogent.VariationResult';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ComparisonResult = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ComparisonResult.repeatedFields_, null);
};
goog.inherits(proto.gogent.ComparisonResult, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ComparisonResult.displayName = 'proto.gogent.ComparisonResult';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ExecutionLog = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gogent.ExecutionLog, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ExecutionLog.displayName = 'proto.gogent.ExecutionLog';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gogent.ComparisonConfig = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gogent.ComparisonConfig.repeatedFields_, null);
};
goog.inherits(proto.gogent.ComparisonConfig, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gogent.ComparisonConfig.displayName = 'proto.gogent.ComparisonConfig';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.User.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.User.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.User} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.User.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
username: jspb.Message.getFieldWithDefault(msg, 2, ""),
email: jspb.Message.getFieldWithDefault(msg, 3, ""),
emailVerified: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
isTemporary: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
updatedAt: (f = msg.getUpdatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
lastLoginAt: (f = msg.getLastLoginAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.User}
 */
proto.gogent.User.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.User;
  return proto.gogent.User.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.User} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.User}
 */
proto.gogent.User.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEmailVerified(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsTemporary(value);
      break;
    case 6:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    case 7:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setUpdatedAt(value);
      break;
    case 8:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setLastLoginAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.User.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.User.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.User} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.User.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getEmailVerified();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getIsTemporary();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getUpdatedAt();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getLastLoginAt();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.User.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string username = 2;
 * @return {string}
 */
proto.gogent.User.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string email = 3;
 * @return {string}
 */
proto.gogent.User.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional bool email_verified = 4;
 * @return {boolean}
 */
proto.gogent.User.prototype.getEmailVerified = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.setEmailVerified = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional bool is_temporary = 5;
 * @return {boolean}
 */
proto.gogent.User.prototype.getIsTemporary = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.setIsTemporary = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional google.protobuf.Timestamp created_at = 6;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.User.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 6));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.User} returns this
*/
proto.gogent.User.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.User.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional google.protobuf.Timestamp updated_at = 7;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.User.prototype.getUpdatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 7));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.User} returns this
*/
proto.gogent.User.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.clearUpdatedAt = function() {
  return this.setUpdatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.User.prototype.hasUpdatedAt = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional google.protobuf.Timestamp last_login_at = 8;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.User.prototype.getLastLoginAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 8));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.User} returns this
*/
proto.gogent.User.prototype.setLastLoginAt = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.User} returns this
 */
proto.gogent.User.prototype.clearLastLoginAt = function() {
  return this.setLastLoginAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.User.prototype.hasLastLoginAt = function() {
  return jspb.Message.getField(this, 8) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.LoginRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.LoginRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.LoginRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.LoginRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
password: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.LoginRequest}
 */
proto.gogent.LoginRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.LoginRequest;
  return proto.gogent.LoginRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.LoginRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.LoginRequest}
 */
proto.gogent.LoginRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.LoginRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.LoginRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.LoginRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.LoginRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.gogent.LoginRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.LoginRequest} returns this
 */
proto.gogent.LoginRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.gogent.LoginRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.LoginRequest} returns this
 */
proto.gogent.LoginRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.LoginResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.LoginResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.LoginResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.LoginResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
token: jspb.Message.getFieldWithDefault(msg, 1, ""),
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f),
expiresAt: (f = msg.getExpiresAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.LoginResponse}
 */
proto.gogent.LoginResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.LoginResponse;
  return proto.gogent.LoginResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.LoginResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.LoginResponse}
 */
proto.gogent.LoginResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    case 2:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 3:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setExpiresAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.LoginResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.LoginResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.LoginResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.LoginResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
  f = message.getExpiresAt();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string token = 1;
 * @return {string}
 */
proto.gogent.LoginResponse.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.LoginResponse} returns this
 */
proto.gogent.LoginResponse.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional User user = 2;
 * @return {?proto.gogent.User}
 */
proto.gogent.LoginResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 2));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.LoginResponse} returns this
*/
proto.gogent.LoginResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.LoginResponse} returns this
 */
proto.gogent.LoginResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.LoginResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional google.protobuf.Timestamp expires_at = 3;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.LoginResponse.prototype.getExpiresAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 3));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.LoginResponse} returns this
*/
proto.gogent.LoginResponse.prototype.setExpiresAt = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.LoginResponse} returns this
 */
proto.gogent.LoginResponse.prototype.clearExpiresAt = function() {
  return this.setExpiresAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.LoginResponse.prototype.hasExpiresAt = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.RegisterRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.RegisterRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.RegisterRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.RegisterRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
email: jspb.Message.getFieldWithDefault(msg, 2, ""),
password: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.RegisterRequest}
 */
proto.gogent.RegisterRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.RegisterRequest;
  return proto.gogent.RegisterRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.RegisterRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.RegisterRequest}
 */
proto.gogent.RegisterRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.RegisterRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.RegisterRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.RegisterRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.RegisterRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.gogent.RegisterRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.RegisterRequest} returns this
 */
proto.gogent.RegisterRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string email = 2;
 * @return {string}
 */
proto.gogent.RegisterRequest.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.RegisterRequest} returns this
 */
proto.gogent.RegisterRequest.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string password = 3;
 * @return {string}
 */
proto.gogent.RegisterRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.RegisterRequest} returns this
 */
proto.gogent.RegisterRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.RegisterResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.RegisterResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.RegisterResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.RegisterResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f),
token: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.RegisterResponse}
 */
proto.gogent.RegisterResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.RegisterResponse;
  return proto.gogent.RegisterResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.RegisterResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.RegisterResponse}
 */
proto.gogent.RegisterResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.RegisterResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.RegisterResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.RegisterResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.RegisterResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional User user = 1;
 * @return {?proto.gogent.User}
 */
proto.gogent.RegisterResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 1));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.RegisterResponse} returns this
*/
proto.gogent.RegisterResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.RegisterResponse} returns this
 */
proto.gogent.RegisterResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.RegisterResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string token = 2;
 * @return {string}
 */
proto.gogent.RegisterResponse.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.RegisterResponse} returns this
 */
proto.gogent.RegisterResponse.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateTemporaryUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateTemporaryUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateTemporaryUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateTemporaryUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
sessionId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateTemporaryUserRequest}
 */
proto.gogent.CreateTemporaryUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateTemporaryUserRequest;
  return proto.gogent.CreateTemporaryUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateTemporaryUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateTemporaryUserRequest}
 */
proto.gogent.CreateTemporaryUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSessionId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateTemporaryUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateTemporaryUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateTemporaryUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateTemporaryUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSessionId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string session_id = 1;
 * @return {string}
 */
proto.gogent.CreateTemporaryUserRequest.prototype.getSessionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.CreateTemporaryUserRequest} returns this
 */
proto.gogent.CreateTemporaryUserRequest.prototype.setSessionId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateTemporaryUserResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateTemporaryUserResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateTemporaryUserResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f),
temporaryPassword: jspb.Message.getFieldWithDefault(msg, 2, ""),
token: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateTemporaryUserResponse}
 */
proto.gogent.CreateTemporaryUserResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateTemporaryUserResponse;
  return proto.gogent.CreateTemporaryUserResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateTemporaryUserResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateTemporaryUserResponse}
 */
proto.gogent.CreateTemporaryUserResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTemporaryPassword(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateTemporaryUserResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateTemporaryUserResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateTemporaryUserResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
  f = message.getTemporaryPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional User user = 1;
 * @return {?proto.gogent.User}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 1));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.CreateTemporaryUserResponse} returns this
*/
proto.gogent.CreateTemporaryUserResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.CreateTemporaryUserResponse} returns this
 */
proto.gogent.CreateTemporaryUserResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string temporary_password = 2;
 * @return {string}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.getTemporaryPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.CreateTemporaryUserResponse} returns this
 */
proto.gogent.CreateTemporaryUserResponse.prototype.setTemporaryPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string token = 3;
 * @return {string}
 */
proto.gogent.CreateTemporaryUserResponse.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.CreateTemporaryUserResponse} returns this
 */
proto.gogent.CreateTemporaryUserResponse.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.SaveTemporaryAccountRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.SaveTemporaryAccountRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.SaveTemporaryAccountRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
email: jspb.Message.getFieldWithDefault(msg, 1, ""),
currentPassword: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.SaveTemporaryAccountRequest}
 */
proto.gogent.SaveTemporaryAccountRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.SaveTemporaryAccountRequest;
  return proto.gogent.SaveTemporaryAccountRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.SaveTemporaryAccountRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.SaveTemporaryAccountRequest}
 */
proto.gogent.SaveTemporaryAccountRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setCurrentPassword(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.SaveTemporaryAccountRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.SaveTemporaryAccountRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.SaveTemporaryAccountRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCurrentPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string email = 1;
 * @return {string}
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.SaveTemporaryAccountRequest} returns this
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string current_password = 2;
 * @return {string}
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.getCurrentPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.SaveTemporaryAccountRequest} returns this
 */
proto.gogent.SaveTemporaryAccountRequest.prototype.setCurrentPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.SaveTemporaryAccountResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.SaveTemporaryAccountResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.SaveTemporaryAccountResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f),
emailSent: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.SaveTemporaryAccountResponse}
 */
proto.gogent.SaveTemporaryAccountResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.SaveTemporaryAccountResponse;
  return proto.gogent.SaveTemporaryAccountResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.SaveTemporaryAccountResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.SaveTemporaryAccountResponse}
 */
proto.gogent.SaveTemporaryAccountResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEmailSent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.SaveTemporaryAccountResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.SaveTemporaryAccountResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.SaveTemporaryAccountResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
  f = message.getEmailSent();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional User user = 1;
 * @return {?proto.gogent.User}
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 1));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.SaveTemporaryAccountResponse} returns this
*/
proto.gogent.SaveTemporaryAccountResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.SaveTemporaryAccountResponse} returns this
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool email_sent = 2;
 * @return {boolean}
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.getEmailSent = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.SaveTemporaryAccountResponse} returns this
 */
proto.gogent.SaveTemporaryAccountResponse.prototype.setEmailSent = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.VerifyEmailRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.VerifyEmailRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.VerifyEmailRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VerifyEmailRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
token: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.VerifyEmailRequest}
 */
proto.gogent.VerifyEmailRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.VerifyEmailRequest;
  return proto.gogent.VerifyEmailRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.VerifyEmailRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.VerifyEmailRequest}
 */
proto.gogent.VerifyEmailRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.VerifyEmailRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.VerifyEmailRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.VerifyEmailRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VerifyEmailRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string token = 1;
 * @return {string}
 */
proto.gogent.VerifyEmailRequest.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.VerifyEmailRequest} returns this
 */
proto.gogent.VerifyEmailRequest.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.VerifyEmailResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.VerifyEmailResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.VerifyEmailResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VerifyEmailResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f),
verified: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.VerifyEmailResponse}
 */
proto.gogent.VerifyEmailResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.VerifyEmailResponse;
  return proto.gogent.VerifyEmailResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.VerifyEmailResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.VerifyEmailResponse}
 */
proto.gogent.VerifyEmailResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setVerified(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.VerifyEmailResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.VerifyEmailResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.VerifyEmailResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VerifyEmailResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
  f = message.getVerified();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional User user = 1;
 * @return {?proto.gogent.User}
 */
proto.gogent.VerifyEmailResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 1));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.VerifyEmailResponse} returns this
*/
proto.gogent.VerifyEmailResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.VerifyEmailResponse} returns this
 */
proto.gogent.VerifyEmailResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.VerifyEmailResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool verified = 2;
 * @return {boolean}
 */
proto.gogent.VerifyEmailResponse.prototype.getVerified = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.VerifyEmailResponse} returns this
 */
proto.gogent.VerifyEmailResponse.prototype.setVerified = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetCurrentUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetCurrentUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetCurrentUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetCurrentUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetCurrentUserRequest}
 */
proto.gogent.GetCurrentUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetCurrentUserRequest;
  return proto.gogent.GetCurrentUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetCurrentUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetCurrentUserRequest}
 */
proto.gogent.GetCurrentUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetCurrentUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetCurrentUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetCurrentUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetCurrentUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetCurrentUserResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetCurrentUserResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetCurrentUserResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetCurrentUserResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
user: (f = msg.getUser()) && proto.gogent.User.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetCurrentUserResponse}
 */
proto.gogent.GetCurrentUserResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetCurrentUserResponse;
  return proto.gogent.GetCurrentUserResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetCurrentUserResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetCurrentUserResponse}
 */
proto.gogent.GetCurrentUserResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.User;
      reader.readMessage(value,proto.gogent.User.deserializeBinaryFromReader);
      msg.setUser(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetCurrentUserResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetCurrentUserResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetCurrentUserResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetCurrentUserResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUser();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.User.serializeBinaryToWriter
    );
  }
};


/**
 * optional User user = 1;
 * @return {?proto.gogent.User}
 */
proto.gogent.GetCurrentUserResponse.prototype.getUser = function() {
  return /** @type{?proto.gogent.User} */ (
    jspb.Message.getWrapperField(this, proto.gogent.User, 1));
};


/**
 * @param {?proto.gogent.User|undefined} value
 * @return {!proto.gogent.GetCurrentUserResponse} returns this
*/
proto.gogent.GetCurrentUserResponse.prototype.setUser = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetCurrentUserResponse} returns this
 */
proto.gogent.GetCurrentUserResponse.prototype.clearUser = function() {
  return this.setUser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetCurrentUserResponse.prototype.hasUser = function() {
  return jspb.Message.getField(this, 1) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ExecuteRequest.repeatedFields_ = [6,7];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ExecuteRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ExecuteRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ExecuteRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecuteRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
executionRunName: jspb.Message.getFieldWithDefault(msg, 1, ""),
description: jspb.Message.getFieldWithDefault(msg, 2, ""),
basePrompt: jspb.Message.getFieldWithDefault(msg, 3, ""),
context: jspb.Message.getFieldWithDefault(msg, 4, ""),
enableFunctionCalling: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
configurationsList: jspb.Message.toObjectList(msg.getConfigurationsList(),
    proto.gogent.APIConfiguration.toObject, includeInstance),
functionToolsList: jspb.Message.toObjectList(msg.getFunctionToolsList(),
    proto.gogent.Tool.toObject, includeInstance),
comparisonConfig: (f = msg.getComparisonConfig()) && proto.gogent.ComparisonConfig.toObject(includeInstance, f),
useMock: jspb.Message.getBooleanFieldWithDefault(msg, 9, false),
openweatherApiKey: jspb.Message.getFieldWithDefault(msg, 10, ""),
neo4jUrl: jspb.Message.getFieldWithDefault(msg, 11, ""),
neo4jUsername: jspb.Message.getFieldWithDefault(msg, 12, ""),
neo4jPassword: jspb.Message.getFieldWithDefault(msg, 13, ""),
neo4jDatabase: jspb.Message.getFieldWithDefault(msg, 14, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ExecuteRequest}
 */
proto.gogent.ExecuteRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ExecuteRequest;
  return proto.gogent.ExecuteRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ExecuteRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ExecuteRequest}
 */
proto.gogent.ExecuteRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setBasePrompt(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setContext(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnableFunctionCalling(value);
      break;
    case 6:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.addConfigurations(value);
      break;
    case 7:
      var value = new proto.gogent.Tool;
      reader.readMessage(value,proto.gogent.Tool.deserializeBinaryFromReader);
      msg.addFunctionTools(value);
      break;
    case 8:
      var value = new proto.gogent.ComparisonConfig;
      reader.readMessage(value,proto.gogent.ComparisonConfig.deserializeBinaryFromReader);
      msg.setComparisonConfig(value);
      break;
    case 9:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setUseMock(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setOpenweatherApiKey(value);
      break;
    case 11:
      var value = /** @type {string} */ (reader.readString());
      msg.setNeo4jUrl(value);
      break;
    case 12:
      var value = /** @type {string} */ (reader.readString());
      msg.setNeo4jUsername(value);
      break;
    case 13:
      var value = /** @type {string} */ (reader.readString());
      msg.setNeo4jPassword(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setNeo4jDatabase(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ExecuteRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ExecuteRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ExecuteRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecuteRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionRunName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getBasePrompt();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getContext();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getEnableFunctionCalling();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getConfigurationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      6,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
  f = message.getFunctionToolsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.gogent.Tool.serializeBinaryToWriter
    );
  }
  f = message.getComparisonConfig();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.gogent.ComparisonConfig.serializeBinaryToWriter
    );
  }
  f = message.getUseMock();
  if (f) {
    writer.writeBool(
      9,
      f
    );
  }
  f = message.getOpenweatherApiKey();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getNeo4jUrl();
  if (f.length > 0) {
    writer.writeString(
      11,
      f
    );
  }
  f = message.getNeo4jUsername();
  if (f.length > 0) {
    writer.writeString(
      12,
      f
    );
  }
  f = message.getNeo4jPassword();
  if (f.length > 0) {
    writer.writeString(
      13,
      f
    );
  }
  f = message.getNeo4jDatabase();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
};


/**
 * optional string execution_run_name = 1;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getExecutionRunName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setExecutionRunName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string description = 2;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string base_prompt = 3;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getBasePrompt = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setBasePrompt = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string context = 4;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getContext = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setContext = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional bool enable_function_calling = 5;
 * @return {boolean}
 */
proto.gogent.ExecuteRequest.prototype.getEnableFunctionCalling = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setEnableFunctionCalling = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * repeated APIConfiguration configurations = 6;
 * @return {!Array<!proto.gogent.APIConfiguration>}
 */
proto.gogent.ExecuteRequest.prototype.getConfigurationsList = function() {
  return /** @type{!Array<!proto.gogent.APIConfiguration>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.APIConfiguration, 6));
};


/**
 * @param {!Array<!proto.gogent.APIConfiguration>} value
 * @return {!proto.gogent.ExecuteRequest} returns this
*/
proto.gogent.ExecuteRequest.prototype.setConfigurationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 6, value);
};


/**
 * @param {!proto.gogent.APIConfiguration=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.APIConfiguration}
 */
proto.gogent.ExecuteRequest.prototype.addConfigurations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 6, opt_value, proto.gogent.APIConfiguration, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.clearConfigurationsList = function() {
  return this.setConfigurationsList([]);
};


/**
 * repeated Tool function_tools = 7;
 * @return {!Array<!proto.gogent.Tool>}
 */
proto.gogent.ExecuteRequest.prototype.getFunctionToolsList = function() {
  return /** @type{!Array<!proto.gogent.Tool>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.Tool, 7));
};


/**
 * @param {!Array<!proto.gogent.Tool>} value
 * @return {!proto.gogent.ExecuteRequest} returns this
*/
proto.gogent.ExecuteRequest.prototype.setFunctionToolsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.gogent.Tool=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.Tool}
 */
proto.gogent.ExecuteRequest.prototype.addFunctionTools = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.gogent.Tool, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.clearFunctionToolsList = function() {
  return this.setFunctionToolsList([]);
};


/**
 * optional ComparisonConfig comparison_config = 8;
 * @return {?proto.gogent.ComparisonConfig}
 */
proto.gogent.ExecuteRequest.prototype.getComparisonConfig = function() {
  return /** @type{?proto.gogent.ComparisonConfig} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ComparisonConfig, 8));
};


/**
 * @param {?proto.gogent.ComparisonConfig|undefined} value
 * @return {!proto.gogent.ExecuteRequest} returns this
*/
proto.gogent.ExecuteRequest.prototype.setComparisonConfig = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.clearComparisonConfig = function() {
  return this.setComparisonConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecuteRequest.prototype.hasComparisonConfig = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional bool use_mock = 9;
 * @return {boolean}
 */
proto.gogent.ExecuteRequest.prototype.getUseMock = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 9, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setUseMock = function(value) {
  return jspb.Message.setProto3BooleanField(this, 9, value);
};


/**
 * optional string openweather_api_key = 10;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getOpenweatherApiKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setOpenweatherApiKey = function(value) {
  return jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional string neo4j_url = 11;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getNeo4jUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setNeo4jUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 11, value);
};


/**
 * optional string neo4j_username = 12;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getNeo4jUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 12, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setNeo4jUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 12, value);
};


/**
 * optional string neo4j_password = 13;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getNeo4jPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 13, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setNeo4jPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 13, value);
};


/**
 * optional string neo4j_database = 14;
 * @return {string}
 */
proto.gogent.ExecuteRequest.prototype.getNeo4jDatabase = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteRequest} returns this
 */
proto.gogent.ExecuteRequest.prototype.setNeo4jDatabase = function(value) {
  return jspb.Message.setProto3StringField(this, 14, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ExecuteResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ExecuteResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ExecuteResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecuteResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
executionId: jspb.Message.getFieldWithDefault(msg, 1, ""),
message: jspb.Message.getFieldWithDefault(msg, 2, ""),
executionRun: (f = msg.getExecutionRun()) && proto.gogent.ExecutionRun.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ExecuteResponse}
 */
proto.gogent.ExecuteResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ExecuteResponse;
  return proto.gogent.ExecuteResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ExecuteResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ExecuteResponse}
 */
proto.gogent.ExecuteResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    case 3:
      var value = new proto.gogent.ExecutionRun;
      reader.readMessage(value,proto.gogent.ExecutionRun.deserializeBinaryFromReader);
      msg.setExecutionRun(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ExecuteResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ExecuteResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ExecuteResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecuteResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getExecutionRun();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.gogent.ExecutionRun.serializeBinaryToWriter
    );
  }
};


/**
 * optional string execution_id = 1;
 * @return {string}
 */
proto.gogent.ExecuteResponse.prototype.getExecutionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteResponse} returns this
 */
proto.gogent.ExecuteResponse.prototype.setExecutionId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.gogent.ExecuteResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecuteResponse} returns this
 */
proto.gogent.ExecuteResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional ExecutionRun execution_run = 3;
 * @return {?proto.gogent.ExecutionRun}
 */
proto.gogent.ExecuteResponse.prototype.getExecutionRun = function() {
  return /** @type{?proto.gogent.ExecutionRun} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ExecutionRun, 3));
};


/**
 * @param {?proto.gogent.ExecutionRun|undefined} value
 * @return {!proto.gogent.ExecuteResponse} returns this
*/
proto.gogent.ExecuteResponse.prototype.setExecutionRun = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecuteResponse} returns this
 */
proto.gogent.ExecuteResponse.prototype.clearExecutionRun = function() {
  return this.setExecutionRun(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecuteResponse.prototype.hasExecutionRun = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetExecutionStatusRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetExecutionStatusRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetExecutionStatusRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionStatusRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
executionId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetExecutionStatusRequest}
 */
proto.gogent.GetExecutionStatusRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetExecutionStatusRequest;
  return proto.gogent.GetExecutionStatusRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetExecutionStatusRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetExecutionStatusRequest}
 */
proto.gogent.GetExecutionStatusRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetExecutionStatusRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetExecutionStatusRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetExecutionStatusRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionStatusRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string execution_id = 1;
 * @return {string}
 */
proto.gogent.GetExecutionStatusRequest.prototype.getExecutionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetExecutionStatusRequest} returns this
 */
proto.gogent.GetExecutionStatusRequest.prototype.setExecutionId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetExecutionStatusResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetExecutionStatusResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetExecutionStatusResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionStatusResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
status: jspb.Message.getFieldWithDefault(msg, 1, ""),
errorMessage: jspb.Message.getFieldWithDefault(msg, 2, ""),
startTime: (f = msg.getStartTime()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
endTime: (f = msg.getEndTime()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
result: (f = msg.getResult()) && proto.gogent.ExecutionResult.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetExecutionStatusResponse}
 */
proto.gogent.GetExecutionStatusResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetExecutionStatusResponse;
  return proto.gogent.GetExecutionStatusResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetExecutionStatusResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetExecutionStatusResponse}
 */
proto.gogent.GetExecutionStatusResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorMessage(value);
      break;
    case 3:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setStartTime(value);
      break;
    case 4:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setEndTime(value);
      break;
    case 5:
      var value = new proto.gogent.ExecutionResult;
      reader.readMessage(value,proto.gogent.ExecutionResult.deserializeBinaryFromReader);
      msg.setResult(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetExecutionStatusResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetExecutionStatusResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetExecutionStatusResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionStatusResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getErrorMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getStartTime();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getEndTime();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getResult();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.gogent.ExecutionResult.serializeBinaryToWriter
    );
  }
};


/**
 * optional string status = 1;
 * @return {string}
 */
proto.gogent.GetExecutionStatusResponse.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
 */
proto.gogent.GetExecutionStatusResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string error_message = 2;
 * @return {string}
 */
proto.gogent.GetExecutionStatusResponse.prototype.getErrorMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
 */
proto.gogent.GetExecutionStatusResponse.prototype.setErrorMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional google.protobuf.Timestamp start_time = 3;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.GetExecutionStatusResponse.prototype.getStartTime = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 3));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
*/
proto.gogent.GetExecutionStatusResponse.prototype.setStartTime = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
 */
proto.gogent.GetExecutionStatusResponse.prototype.clearStartTime = function() {
  return this.setStartTime(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetExecutionStatusResponse.prototype.hasStartTime = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional google.protobuf.Timestamp end_time = 4;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.GetExecutionStatusResponse.prototype.getEndTime = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 4));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
*/
proto.gogent.GetExecutionStatusResponse.prototype.setEndTime = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
 */
proto.gogent.GetExecutionStatusResponse.prototype.clearEndTime = function() {
  return this.setEndTime(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetExecutionStatusResponse.prototype.hasEndTime = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional ExecutionResult result = 5;
 * @return {?proto.gogent.ExecutionResult}
 */
proto.gogent.GetExecutionStatusResponse.prototype.getResult = function() {
  return /** @type{?proto.gogent.ExecutionResult} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ExecutionResult, 5));
};


/**
 * @param {?proto.gogent.ExecutionResult|undefined} value
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
*/
proto.gogent.GetExecutionStatusResponse.prototype.setResult = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetExecutionStatusResponse} returns this
 */
proto.gogent.GetExecutionStatusResponse.prototype.clearResult = function() {
  return this.setResult(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetExecutionStatusResponse.prototype.hasResult = function() {
  return jspb.Message.getField(this, 5) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetExecutionResultRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetExecutionResultRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetExecutionResultRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionResultRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
executionRunId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetExecutionResultRequest}
 */
proto.gogent.GetExecutionResultRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetExecutionResultRequest;
  return proto.gogent.GetExecutionResultRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetExecutionResultRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetExecutionResultRequest}
 */
proto.gogent.GetExecutionResultRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetExecutionResultRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetExecutionResultRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetExecutionResultRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionResultRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string execution_run_id = 1;
 * @return {string}
 */
proto.gogent.GetExecutionResultRequest.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetExecutionResultRequest} returns this
 */
proto.gogent.GetExecutionResultRequest.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetExecutionResultResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetExecutionResultResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetExecutionResultResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionResultResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
result: (f = msg.getResult()) && proto.gogent.ExecutionResult.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetExecutionResultResponse}
 */
proto.gogent.GetExecutionResultResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetExecutionResultResponse;
  return proto.gogent.GetExecutionResultResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetExecutionResultResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetExecutionResultResponse}
 */
proto.gogent.GetExecutionResultResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.ExecutionResult;
      reader.readMessage(value,proto.gogent.ExecutionResult.deserializeBinaryFromReader);
      msg.setResult(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetExecutionResultResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetExecutionResultResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetExecutionResultResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetExecutionResultResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResult();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.ExecutionResult.serializeBinaryToWriter
    );
  }
};


/**
 * optional ExecutionResult result = 1;
 * @return {?proto.gogent.ExecutionResult}
 */
proto.gogent.GetExecutionResultResponse.prototype.getResult = function() {
  return /** @type{?proto.gogent.ExecutionResult} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ExecutionResult, 1));
};


/**
 * @param {?proto.gogent.ExecutionResult|undefined} value
 * @return {!proto.gogent.GetExecutionResultResponse} returns this
*/
proto.gogent.GetExecutionResultResponse.prototype.setResult = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetExecutionResultResponse} returns this
 */
proto.gogent.GetExecutionResultResponse.prototype.clearResult = function() {
  return this.setResult(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetExecutionResultResponse.prototype.hasResult = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListExecutionRunsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListExecutionRunsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListExecutionRunsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListExecutionRunsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
limit: jspb.Message.getFieldWithDefault(msg, 1, 0),
offset: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListExecutionRunsRequest}
 */
proto.gogent.ListExecutionRunsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListExecutionRunsRequest;
  return proto.gogent.ListExecutionRunsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListExecutionRunsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListExecutionRunsRequest}
 */
proto.gogent.ListExecutionRunsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setLimit(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setOffset(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListExecutionRunsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListExecutionRunsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListExecutionRunsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListExecutionRunsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLimit();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getOffset();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional int32 limit = 1;
 * @return {number}
 */
proto.gogent.ListExecutionRunsRequest.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ListExecutionRunsRequest} returns this
 */
proto.gogent.ListExecutionRunsRequest.prototype.setLimit = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int32 offset = 2;
 * @return {number}
 */
proto.gogent.ListExecutionRunsRequest.prototype.getOffset = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ListExecutionRunsRequest} returns this
 */
proto.gogent.ListExecutionRunsRequest.prototype.setOffset = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ListExecutionRunsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListExecutionRunsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListExecutionRunsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListExecutionRunsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListExecutionRunsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
executionRunsList: jspb.Message.toObjectList(msg.getExecutionRunsList(),
    proto.gogent.ExecutionRun.toObject, includeInstance),
totalCount: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListExecutionRunsResponse}
 */
proto.gogent.ListExecutionRunsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListExecutionRunsResponse;
  return proto.gogent.ListExecutionRunsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListExecutionRunsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListExecutionRunsResponse}
 */
proto.gogent.ListExecutionRunsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.ExecutionRun;
      reader.readMessage(value,proto.gogent.ExecutionRun.deserializeBinaryFromReader);
      msg.addExecutionRuns(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalCount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListExecutionRunsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListExecutionRunsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListExecutionRunsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListExecutionRunsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionRunsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gogent.ExecutionRun.serializeBinaryToWriter
    );
  }
  f = message.getTotalCount();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * repeated ExecutionRun execution_runs = 1;
 * @return {!Array<!proto.gogent.ExecutionRun>}
 */
proto.gogent.ListExecutionRunsResponse.prototype.getExecutionRunsList = function() {
  return /** @type{!Array<!proto.gogent.ExecutionRun>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.ExecutionRun, 1));
};


/**
 * @param {!Array<!proto.gogent.ExecutionRun>} value
 * @return {!proto.gogent.ListExecutionRunsResponse} returns this
*/
proto.gogent.ListExecutionRunsResponse.prototype.setExecutionRunsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gogent.ExecutionRun=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.ExecutionRun}
 */
proto.gogent.ListExecutionRunsResponse.prototype.addExecutionRuns = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gogent.ExecutionRun, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ListExecutionRunsResponse} returns this
 */
proto.gogent.ListExecutionRunsResponse.prototype.clearExecutionRunsList = function() {
  return this.setExecutionRunsList([]);
};


/**
 * optional int32 total_count = 2;
 * @return {number}
 */
proto.gogent.ListExecutionRunsResponse.prototype.getTotalCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ListExecutionRunsResponse} returns this
 */
proto.gogent.ListExecutionRunsResponse.prototype.setTotalCount = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteExecutionRunRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteExecutionRunRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteExecutionRunRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteExecutionRunRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
executionRunId: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteExecutionRunRequest}
 */
proto.gogent.DeleteExecutionRunRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteExecutionRunRequest;
  return proto.gogent.DeleteExecutionRunRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteExecutionRunRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteExecutionRunRequest}
 */
proto.gogent.DeleteExecutionRunRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteExecutionRunRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteExecutionRunRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteExecutionRunRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteExecutionRunRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string execution_run_id = 1;
 * @return {string}
 */
proto.gogent.DeleteExecutionRunRequest.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteExecutionRunRequest} returns this
 */
proto.gogent.DeleteExecutionRunRequest.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteExecutionRunResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteExecutionRunResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteExecutionRunResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteExecutionRunResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
message: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteExecutionRunResponse}
 */
proto.gogent.DeleteExecutionRunResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteExecutionRunResponse;
  return proto.gogent.DeleteExecutionRunResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteExecutionRunResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteExecutionRunResponse}
 */
proto.gogent.DeleteExecutionRunResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteExecutionRunResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteExecutionRunResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteExecutionRunResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteExecutionRunResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string message = 1;
 * @return {string}
 */
proto.gogent.DeleteExecutionRunResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteExecutionRunResponse} returns this
 */
proto.gogent.DeleteExecutionRunResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListConfigurationsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListConfigurationsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListConfigurationsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListConfigurationsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListConfigurationsRequest}
 */
proto.gogent.ListConfigurationsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListConfigurationsRequest;
  return proto.gogent.ListConfigurationsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListConfigurationsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListConfigurationsRequest}
 */
proto.gogent.ListConfigurationsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListConfigurationsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListConfigurationsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListConfigurationsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListConfigurationsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ListConfigurationsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListConfigurationsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListConfigurationsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListConfigurationsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListConfigurationsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
configurationsList: jspb.Message.toObjectList(msg.getConfigurationsList(),
    proto.gogent.APIConfiguration.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListConfigurationsResponse}
 */
proto.gogent.ListConfigurationsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListConfigurationsResponse;
  return proto.gogent.ListConfigurationsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListConfigurationsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListConfigurationsResponse}
 */
proto.gogent.ListConfigurationsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.addConfigurations(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListConfigurationsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListConfigurationsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListConfigurationsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListConfigurationsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfigurationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
};


/**
 * repeated APIConfiguration configurations = 1;
 * @return {!Array<!proto.gogent.APIConfiguration>}
 */
proto.gogent.ListConfigurationsResponse.prototype.getConfigurationsList = function() {
  return /** @type{!Array<!proto.gogent.APIConfiguration>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.APIConfiguration, 1));
};


/**
 * @param {!Array<!proto.gogent.APIConfiguration>} value
 * @return {!proto.gogent.ListConfigurationsResponse} returns this
*/
proto.gogent.ListConfigurationsResponse.prototype.setConfigurationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gogent.APIConfiguration=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.APIConfiguration}
 */
proto.gogent.ListConfigurationsResponse.prototype.addConfigurations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gogent.APIConfiguration, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ListConfigurationsResponse} returns this
 */
proto.gogent.ListConfigurationsResponse.prototype.clearConfigurationsList = function() {
  return this.setConfigurationsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
configuration: (f = msg.getConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateConfigurationRequest}
 */
proto.gogent.CreateConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateConfigurationRequest;
  return proto.gogent.CreateConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateConfigurationRequest}
 */
proto.gogent.CreateConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setConfiguration(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfiguration();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
};


/**
 * optional APIConfiguration configuration = 1;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.CreateConfigurationRequest.prototype.getConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 1));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.CreateConfigurationRequest} returns this
*/
proto.gogent.CreateConfigurationRequest.prototype.setConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.CreateConfigurationRequest} returns this
 */
proto.gogent.CreateConfigurationRequest.prototype.clearConfiguration = function() {
  return this.setConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.CreateConfigurationRequest.prototype.hasConfiguration = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
configuration: (f = msg.getConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateConfigurationResponse}
 */
proto.gogent.CreateConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateConfigurationResponse;
  return proto.gogent.CreateConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateConfigurationResponse}
 */
proto.gogent.CreateConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setConfiguration(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfiguration();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
};


/**
 * optional APIConfiguration configuration = 1;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.CreateConfigurationResponse.prototype.getConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 1));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.CreateConfigurationResponse} returns this
*/
proto.gogent.CreateConfigurationResponse.prototype.setConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.CreateConfigurationResponse} returns this
 */
proto.gogent.CreateConfigurationResponse.prototype.clearConfiguration = function() {
  return this.setConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.CreateConfigurationResponse.prototype.hasConfiguration = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.UpdateConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.UpdateConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.UpdateConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
configuration: (f = msg.getConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.UpdateConfigurationRequest}
 */
proto.gogent.UpdateConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.UpdateConfigurationRequest;
  return proto.gogent.UpdateConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.UpdateConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.UpdateConfigurationRequest}
 */
proto.gogent.UpdateConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setConfiguration(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.UpdateConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.UpdateConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.UpdateConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getConfiguration();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.UpdateConfigurationRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.UpdateConfigurationRequest} returns this
 */
proto.gogent.UpdateConfigurationRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional APIConfiguration configuration = 2;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.UpdateConfigurationRequest.prototype.getConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 2));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.UpdateConfigurationRequest} returns this
*/
proto.gogent.UpdateConfigurationRequest.prototype.setConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.UpdateConfigurationRequest} returns this
 */
proto.gogent.UpdateConfigurationRequest.prototype.clearConfiguration = function() {
  return this.setConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.UpdateConfigurationRequest.prototype.hasConfiguration = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.UpdateConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.UpdateConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.UpdateConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
configuration: (f = msg.getConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.UpdateConfigurationResponse}
 */
proto.gogent.UpdateConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.UpdateConfigurationResponse;
  return proto.gogent.UpdateConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.UpdateConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.UpdateConfigurationResponse}
 */
proto.gogent.UpdateConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setConfiguration(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.UpdateConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.UpdateConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.UpdateConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfiguration();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
};


/**
 * optional APIConfiguration configuration = 1;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.UpdateConfigurationResponse.prototype.getConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 1));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.UpdateConfigurationResponse} returns this
*/
proto.gogent.UpdateConfigurationResponse.prototype.setConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.UpdateConfigurationResponse} returns this
 */
proto.gogent.UpdateConfigurationResponse.prototype.clearConfiguration = function() {
  return this.setConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.UpdateConfigurationResponse.prototype.hasConfiguration = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteConfigurationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteConfigurationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteConfigurationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteConfigurationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteConfigurationRequest}
 */
proto.gogent.DeleteConfigurationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteConfigurationRequest;
  return proto.gogent.DeleteConfigurationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteConfigurationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteConfigurationRequest}
 */
proto.gogent.DeleteConfigurationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteConfigurationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteConfigurationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteConfigurationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteConfigurationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.DeleteConfigurationRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteConfigurationRequest} returns this
 */
proto.gogent.DeleteConfigurationRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteConfigurationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteConfigurationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteConfigurationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteConfigurationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
message: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteConfigurationResponse}
 */
proto.gogent.DeleteConfigurationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteConfigurationResponse;
  return proto.gogent.DeleteConfigurationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteConfigurationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteConfigurationResponse}
 */
proto.gogent.DeleteConfigurationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteConfigurationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteConfigurationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteConfigurationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteConfigurationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string message = 1;
 * @return {string}
 */
proto.gogent.DeleteConfigurationResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteConfigurationResponse} returns this
 */
proto.gogent.DeleteConfigurationResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListFunctionsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListFunctionsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListFunctionsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListFunctionsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListFunctionsRequest}
 */
proto.gogent.ListFunctionsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListFunctionsRequest;
  return proto.gogent.ListFunctionsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListFunctionsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListFunctionsRequest}
 */
proto.gogent.ListFunctionsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListFunctionsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListFunctionsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListFunctionsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListFunctionsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ListFunctionsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListFunctionsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListFunctionsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListFunctionsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListFunctionsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
functionsList: jspb.Message.toObjectList(msg.getFunctionsList(),
    proto.gogent.FunctionDefinition.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListFunctionsResponse}
 */
proto.gogent.ListFunctionsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListFunctionsResponse;
  return proto.gogent.ListFunctionsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListFunctionsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListFunctionsResponse}
 */
proto.gogent.ListFunctionsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.addFunctions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListFunctionsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListFunctionsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListFunctionsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListFunctionsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunctionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * repeated FunctionDefinition functions = 1;
 * @return {!Array<!proto.gogent.FunctionDefinition>}
 */
proto.gogent.ListFunctionsResponse.prototype.getFunctionsList = function() {
  return /** @type{!Array<!proto.gogent.FunctionDefinition>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.FunctionDefinition, 1));
};


/**
 * @param {!Array<!proto.gogent.FunctionDefinition>} value
 * @return {!proto.gogent.ListFunctionsResponse} returns this
*/
proto.gogent.ListFunctionsResponse.prototype.setFunctionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gogent.FunctionDefinition=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.FunctionDefinition}
 */
proto.gogent.ListFunctionsResponse.prototype.addFunctions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gogent.FunctionDefinition, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ListFunctionsResponse} returns this
 */
proto.gogent.ListFunctionsResponse.prototype.clearFunctionsList = function() {
  return this.setFunctionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetFunctionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetFunctionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetFunctionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetFunctionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetFunctionRequest}
 */
proto.gogent.GetFunctionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetFunctionRequest;
  return proto.gogent.GetFunctionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetFunctionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetFunctionRequest}
 */
proto.gogent.GetFunctionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetFunctionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetFunctionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetFunctionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetFunctionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.GetFunctionRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetFunctionRequest} returns this
 */
proto.gogent.GetFunctionRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetFunctionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetFunctionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetFunctionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetFunctionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_function: (f = msg.getFunction()) && proto.gogent.FunctionDefinition.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetFunctionResponse}
 */
proto.gogent.GetFunctionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetFunctionResponse;
  return proto.gogent.GetFunctionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetFunctionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetFunctionResponse}
 */
proto.gogent.GetFunctionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetFunctionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetFunctionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetFunctionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetFunctionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * optional FunctionDefinition function = 1;
 * @return {?proto.gogent.FunctionDefinition}
 */
proto.gogent.GetFunctionResponse.prototype.getFunction = function() {
  return /** @type{?proto.gogent.FunctionDefinition} */ (
    jspb.Message.getWrapperField(this, proto.gogent.FunctionDefinition, 1));
};


/**
 * @param {?proto.gogent.FunctionDefinition|undefined} value
 * @return {!proto.gogent.GetFunctionResponse} returns this
*/
proto.gogent.GetFunctionResponse.prototype.setFunction = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.GetFunctionResponse} returns this
 */
proto.gogent.GetFunctionResponse.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.GetFunctionResponse.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateFunctionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateFunctionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateFunctionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateFunctionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_function: (f = msg.getFunction()) && proto.gogent.FunctionDefinition.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateFunctionRequest}
 */
proto.gogent.CreateFunctionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateFunctionRequest;
  return proto.gogent.CreateFunctionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateFunctionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateFunctionRequest}
 */
proto.gogent.CreateFunctionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateFunctionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateFunctionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateFunctionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateFunctionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * optional FunctionDefinition function = 1;
 * @return {?proto.gogent.FunctionDefinition}
 */
proto.gogent.CreateFunctionRequest.prototype.getFunction = function() {
  return /** @type{?proto.gogent.FunctionDefinition} */ (
    jspb.Message.getWrapperField(this, proto.gogent.FunctionDefinition, 1));
};


/**
 * @param {?proto.gogent.FunctionDefinition|undefined} value
 * @return {!proto.gogent.CreateFunctionRequest} returns this
*/
proto.gogent.CreateFunctionRequest.prototype.setFunction = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.CreateFunctionRequest} returns this
 */
proto.gogent.CreateFunctionRequest.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.CreateFunctionRequest.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.CreateFunctionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.CreateFunctionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.CreateFunctionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateFunctionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_function: (f = msg.getFunction()) && proto.gogent.FunctionDefinition.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.CreateFunctionResponse}
 */
proto.gogent.CreateFunctionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.CreateFunctionResponse;
  return proto.gogent.CreateFunctionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.CreateFunctionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.CreateFunctionResponse}
 */
proto.gogent.CreateFunctionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.CreateFunctionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.CreateFunctionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.CreateFunctionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.CreateFunctionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * optional FunctionDefinition function = 1;
 * @return {?proto.gogent.FunctionDefinition}
 */
proto.gogent.CreateFunctionResponse.prototype.getFunction = function() {
  return /** @type{?proto.gogent.FunctionDefinition} */ (
    jspb.Message.getWrapperField(this, proto.gogent.FunctionDefinition, 1));
};


/**
 * @param {?proto.gogent.FunctionDefinition|undefined} value
 * @return {!proto.gogent.CreateFunctionResponse} returns this
*/
proto.gogent.CreateFunctionResponse.prototype.setFunction = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.CreateFunctionResponse} returns this
 */
proto.gogent.CreateFunctionResponse.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.CreateFunctionResponse.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.UpdateFunctionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.UpdateFunctionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.UpdateFunctionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateFunctionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
pb_function: (f = msg.getFunction()) && proto.gogent.FunctionDefinition.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.UpdateFunctionRequest}
 */
proto.gogent.UpdateFunctionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.UpdateFunctionRequest;
  return proto.gogent.UpdateFunctionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.UpdateFunctionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.UpdateFunctionRequest}
 */
proto.gogent.UpdateFunctionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.UpdateFunctionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.UpdateFunctionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.UpdateFunctionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateFunctionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.UpdateFunctionRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.UpdateFunctionRequest} returns this
 */
proto.gogent.UpdateFunctionRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional FunctionDefinition function = 2;
 * @return {?proto.gogent.FunctionDefinition}
 */
proto.gogent.UpdateFunctionRequest.prototype.getFunction = function() {
  return /** @type{?proto.gogent.FunctionDefinition} */ (
    jspb.Message.getWrapperField(this, proto.gogent.FunctionDefinition, 2));
};


/**
 * @param {?proto.gogent.FunctionDefinition|undefined} value
 * @return {!proto.gogent.UpdateFunctionRequest} returns this
*/
proto.gogent.UpdateFunctionRequest.prototype.setFunction = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.UpdateFunctionRequest} returns this
 */
proto.gogent.UpdateFunctionRequest.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.UpdateFunctionRequest.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.UpdateFunctionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.UpdateFunctionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.UpdateFunctionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateFunctionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
pb_function: (f = msg.getFunction()) && proto.gogent.FunctionDefinition.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.UpdateFunctionResponse}
 */
proto.gogent.UpdateFunctionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.UpdateFunctionResponse;
  return proto.gogent.UpdateFunctionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.UpdateFunctionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.UpdateFunctionResponse}
 */
proto.gogent.UpdateFunctionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.FunctionDefinition;
      reader.readMessage(value,proto.gogent.FunctionDefinition.deserializeBinaryFromReader);
      msg.setFunction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.UpdateFunctionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.UpdateFunctionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.UpdateFunctionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.UpdateFunctionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunction();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.FunctionDefinition.serializeBinaryToWriter
    );
  }
};


/**
 * optional FunctionDefinition function = 1;
 * @return {?proto.gogent.FunctionDefinition}
 */
proto.gogent.UpdateFunctionResponse.prototype.getFunction = function() {
  return /** @type{?proto.gogent.FunctionDefinition} */ (
    jspb.Message.getWrapperField(this, proto.gogent.FunctionDefinition, 1));
};


/**
 * @param {?proto.gogent.FunctionDefinition|undefined} value
 * @return {!proto.gogent.UpdateFunctionResponse} returns this
*/
proto.gogent.UpdateFunctionResponse.prototype.setFunction = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.UpdateFunctionResponse} returns this
 */
proto.gogent.UpdateFunctionResponse.prototype.clearFunction = function() {
  return this.setFunction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.UpdateFunctionResponse.prototype.hasFunction = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteFunctionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteFunctionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteFunctionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteFunctionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteFunctionRequest}
 */
proto.gogent.DeleteFunctionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteFunctionRequest;
  return proto.gogent.DeleteFunctionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteFunctionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteFunctionRequest}
 */
proto.gogent.DeleteFunctionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteFunctionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteFunctionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteFunctionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteFunctionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.DeleteFunctionRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteFunctionRequest} returns this
 */
proto.gogent.DeleteFunctionRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.DeleteFunctionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.DeleteFunctionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.DeleteFunctionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteFunctionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
message: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.DeleteFunctionResponse}
 */
proto.gogent.DeleteFunctionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.DeleteFunctionResponse;
  return proto.gogent.DeleteFunctionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.DeleteFunctionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.DeleteFunctionResponse}
 */
proto.gogent.DeleteFunctionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.DeleteFunctionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.DeleteFunctionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.DeleteFunctionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.DeleteFunctionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string message = 1;
 * @return {string}
 */
proto.gogent.DeleteFunctionResponse.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.DeleteFunctionResponse} returns this
 */
proto.gogent.DeleteFunctionResponse.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.TestFunctionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.TestFunctionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.TestFunctionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.TestFunctionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
functionId: jspb.Message.getFieldWithDefault(msg, 1, ""),
arguments: (f = msg.getArguments()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
useMockData: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
timeoutMs: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.TestFunctionRequest}
 */
proto.gogent.TestFunctionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.TestFunctionRequest;
  return proto.gogent.TestFunctionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.TestFunctionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.TestFunctionRequest}
 */
proto.gogent.TestFunctionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setFunctionId(value);
      break;
    case 2:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setArguments(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setUseMockData(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTimeoutMs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.TestFunctionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.TestFunctionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.TestFunctionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.TestFunctionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFunctionId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getArguments();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getUseMockData();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getTimeoutMs();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
};


/**
 * optional string function_id = 1;
 * @return {string}
 */
proto.gogent.TestFunctionRequest.prototype.getFunctionId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.TestFunctionRequest} returns this
 */
proto.gogent.TestFunctionRequest.prototype.setFunctionId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional google.protobuf.Struct arguments = 2;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.TestFunctionRequest.prototype.getArguments = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 2));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.TestFunctionRequest} returns this
*/
proto.gogent.TestFunctionRequest.prototype.setArguments = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.TestFunctionRequest} returns this
 */
proto.gogent.TestFunctionRequest.prototype.clearArguments = function() {
  return this.setArguments(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.TestFunctionRequest.prototype.hasArguments = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional bool use_mock_data = 3;
 * @return {boolean}
 */
proto.gogent.TestFunctionRequest.prototype.getUseMockData = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.TestFunctionRequest} returns this
 */
proto.gogent.TestFunctionRequest.prototype.setUseMockData = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional int32 timeout_ms = 4;
 * @return {number}
 */
proto.gogent.TestFunctionRequest.prototype.getTimeoutMs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.TestFunctionRequest} returns this
 */
proto.gogent.TestFunctionRequest.prototype.setTimeoutMs = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.TestFunctionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.TestFunctionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.TestFunctionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.TestFunctionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
success: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
usedMockData: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
executionTimeMs: jspb.Message.getFieldWithDefault(msg, 3, 0),
response: (f = msg.getResponse()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
errorMessage: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.TestFunctionResponse}
 */
proto.gogent.TestFunctionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.TestFunctionResponse;
  return proto.gogent.TestFunctionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.TestFunctionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.TestFunctionResponse}
 */
proto.gogent.TestFunctionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSuccess(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setUsedMockData(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setExecutionTimeMs(value);
      break;
    case 4:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setResponse(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.TestFunctionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.TestFunctionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.TestFunctionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.TestFunctionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSuccess();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getUsedMockData();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getExecutionTimeMs();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getResponse();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getErrorMessage();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional bool success = 1;
 * @return {boolean}
 */
proto.gogent.TestFunctionResponse.prototype.getSuccess = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.TestFunctionResponse} returns this
 */
proto.gogent.TestFunctionResponse.prototype.setSuccess = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool used_mock_data = 2;
 * @return {boolean}
 */
proto.gogent.TestFunctionResponse.prototype.getUsedMockData = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.TestFunctionResponse} returns this
 */
proto.gogent.TestFunctionResponse.prototype.setUsedMockData = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional int32 execution_time_ms = 3;
 * @return {number}
 */
proto.gogent.TestFunctionResponse.prototype.getExecutionTimeMs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.TestFunctionResponse} returns this
 */
proto.gogent.TestFunctionResponse.prototype.setExecutionTimeMs = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional google.protobuf.Struct response = 4;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.TestFunctionResponse.prototype.getResponse = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 4));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.TestFunctionResponse} returns this
*/
proto.gogent.TestFunctionResponse.prototype.setResponse = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.TestFunctionResponse} returns this
 */
proto.gogent.TestFunctionResponse.prototype.clearResponse = function() {
  return this.setResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.TestFunctionResponse.prototype.hasResponse = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional string error_message = 5;
 * @return {string}
 */
proto.gogent.TestFunctionResponse.prototype.getErrorMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.TestFunctionResponse} returns this
 */
proto.gogent.TestFunctionResponse.prototype.setErrorMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetDatabaseStatsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetDatabaseStatsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetDatabaseStatsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetDatabaseStatsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetDatabaseStatsRequest}
 */
proto.gogent.GetDatabaseStatsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetDatabaseStatsRequest;
  return proto.gogent.GetDatabaseStatsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetDatabaseStatsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetDatabaseStatsRequest}
 */
proto.gogent.GetDatabaseStatsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetDatabaseStatsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetDatabaseStatsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetDatabaseStatsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetDatabaseStatsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetDatabaseStatsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetDatabaseStatsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetDatabaseStatsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
totalExecutionRuns: jspb.Message.getFieldWithDefault(msg, 1, 0),
totalApiRequests: jspb.Message.getFieldWithDefault(msg, 2, 0),
totalApiResponses: jspb.Message.getFieldWithDefault(msg, 3, 0),
totalFunctionCalls: jspb.Message.getFieldWithDefault(msg, 4, 0),
avgResponseTime: jspb.Message.getFloatingPointFieldWithDefault(msg, 5, 0.0),
successRate: jspb.Message.getFloatingPointFieldWithDefault(msg, 6, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetDatabaseStatsResponse}
 */
proto.gogent.GetDatabaseStatsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetDatabaseStatsResponse;
  return proto.gogent.GetDatabaseStatsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetDatabaseStatsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetDatabaseStatsResponse}
 */
proto.gogent.GetDatabaseStatsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalExecutionRuns(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalApiRequests(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalApiResponses(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalFunctionCalls(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setAvgResponseTime(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setSuccessRate(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetDatabaseStatsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetDatabaseStatsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetDatabaseStatsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTotalExecutionRuns();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getTotalApiRequests();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getTotalApiResponses();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getTotalFunctionCalls();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getAvgResponseTime();
  if (f !== 0.0) {
    writer.writeDouble(
      5,
      f
    );
  }
  f = message.getSuccessRate();
  if (f !== 0.0) {
    writer.writeDouble(
      6,
      f
    );
  }
};


/**
 * optional int32 total_execution_runs = 1;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getTotalExecutionRuns = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setTotalExecutionRuns = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int32 total_api_requests = 2;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getTotalApiRequests = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setTotalApiRequests = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 total_api_responses = 3;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getTotalApiResponses = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setTotalApiResponses = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int32 total_function_calls = 4;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getTotalFunctionCalls = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setTotalFunctionCalls = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional double avg_response_time = 5;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getAvgResponseTime = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 5, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setAvgResponseTime = function(value) {
  return jspb.Message.setProto3FloatField(this, 5, value);
};


/**
 * optional double success_rate = 6;
 * @return {number}
 */
proto.gogent.GetDatabaseStatsResponse.prototype.getSuccessRate = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 6, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetDatabaseStatsResponse} returns this
 */
proto.gogent.GetDatabaseStatsResponse.prototype.setSuccessRate = function(value) {
  return jspb.Message.setProto3FloatField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListDatabaseTablesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListDatabaseTablesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListDatabaseTablesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListDatabaseTablesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListDatabaseTablesRequest}
 */
proto.gogent.ListDatabaseTablesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListDatabaseTablesRequest;
  return proto.gogent.ListDatabaseTablesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListDatabaseTablesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListDatabaseTablesRequest}
 */
proto.gogent.ListDatabaseTablesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListDatabaseTablesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListDatabaseTablesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListDatabaseTablesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListDatabaseTablesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ListDatabaseTablesResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ListDatabaseTablesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ListDatabaseTablesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ListDatabaseTablesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListDatabaseTablesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
tablesList: (f = jspb.Message.getRepeatedField(msg, 1)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ListDatabaseTablesResponse}
 */
proto.gogent.ListDatabaseTablesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ListDatabaseTablesResponse;
  return proto.gogent.ListDatabaseTablesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ListDatabaseTablesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ListDatabaseTablesResponse}
 */
proto.gogent.ListDatabaseTablesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.addTables(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ListDatabaseTablesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ListDatabaseTablesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ListDatabaseTablesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ListDatabaseTablesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTablesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      1,
      f
    );
  }
};


/**
 * repeated string tables = 1;
 * @return {!Array<string>}
 */
proto.gogent.ListDatabaseTablesResponse.prototype.getTablesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 1));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gogent.ListDatabaseTablesResponse} returns this
 */
proto.gogent.ListDatabaseTablesResponse.prototype.setTablesList = function(value) {
  return jspb.Message.setField(this, 1, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gogent.ListDatabaseTablesResponse} returns this
 */
proto.gogent.ListDatabaseTablesResponse.prototype.addTables = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 1, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ListDatabaseTablesResponse} returns this
 */
proto.gogent.ListDatabaseTablesResponse.prototype.clearTablesList = function() {
  return this.setTablesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetTableDataRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetTableDataRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetTableDataRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetTableDataRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
tableName: jspb.Message.getFieldWithDefault(msg, 1, ""),
limit: jspb.Message.getFieldWithDefault(msg, 2, 0),
offset: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetTableDataRequest}
 */
proto.gogent.GetTableDataRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetTableDataRequest;
  return proto.gogent.GetTableDataRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetTableDataRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetTableDataRequest}
 */
proto.gogent.GetTableDataRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTableName(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setLimit(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setOffset(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetTableDataRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetTableDataRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetTableDataRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetTableDataRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTableName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getLimit();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getOffset();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
};


/**
 * optional string table_name = 1;
 * @return {string}
 */
proto.gogent.GetTableDataRequest.prototype.getTableName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetTableDataRequest} returns this
 */
proto.gogent.GetTableDataRequest.prototype.setTableName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 limit = 2;
 * @return {number}
 */
proto.gogent.GetTableDataRequest.prototype.getLimit = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetTableDataRequest} returns this
 */
proto.gogent.GetTableDataRequest.prototype.setLimit = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 offset = 3;
 * @return {number}
 */
proto.gogent.GetTableDataRequest.prototype.getOffset = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetTableDataRequest} returns this
 */
proto.gogent.GetTableDataRequest.prototype.setOffset = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.GetTableDataResponse.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.GetTableDataResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.GetTableDataResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.GetTableDataResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetTableDataResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
tableName: jspb.Message.getFieldWithDefault(msg, 1, ""),
columnsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
rowsList: jspb.Message.toObjectList(msg.getRowsList(),
    google_protobuf_struct_pb.ListValue.toObject, includeInstance),
totalRows: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.GetTableDataResponse}
 */
proto.gogent.GetTableDataResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.GetTableDataResponse;
  return proto.gogent.GetTableDataResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.GetTableDataResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.GetTableDataResponse}
 */
proto.gogent.GetTableDataResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setTableName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addColumns(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.ListValue;
      reader.readMessage(value,google_protobuf_struct_pb.ListValue.deserializeBinaryFromReader);
      msg.addRows(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalRows(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.GetTableDataResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.GetTableDataResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.GetTableDataResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.GetTableDataResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTableName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getColumnsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getRowsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      google_protobuf_struct_pb.ListValue.serializeBinaryToWriter
    );
  }
  f = message.getTotalRows();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
};


/**
 * optional string table_name = 1;
 * @return {string}
 */
proto.gogent.GetTableDataResponse.prototype.getTableName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.setTableName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * repeated string columns = 2;
 * @return {!Array<string>}
 */
proto.gogent.GetTableDataResponse.prototype.getColumnsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.setColumnsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.addColumns = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.clearColumnsList = function() {
  return this.setColumnsList([]);
};


/**
 * repeated google.protobuf.ListValue rows = 3;
 * @return {!Array<!proto.google.protobuf.ListValue>}
 */
proto.gogent.GetTableDataResponse.prototype.getRowsList = function() {
  return /** @type{!Array<!proto.google.protobuf.ListValue>} */ (
    jspb.Message.getRepeatedWrapperField(this, google_protobuf_struct_pb.ListValue, 3));
};


/**
 * @param {!Array<!proto.google.protobuf.ListValue>} value
 * @return {!proto.gogent.GetTableDataResponse} returns this
*/
proto.gogent.GetTableDataResponse.prototype.setRowsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.google.protobuf.ListValue=} opt_value
 * @param {number=} opt_index
 * @return {!proto.google.protobuf.ListValue}
 */
proto.gogent.GetTableDataResponse.prototype.addRows = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.google.protobuf.ListValue, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.clearRowsList = function() {
  return this.setRowsList([]);
};


/**
 * optional int32 total_rows = 4;
 * @return {number}
 */
proto.gogent.GetTableDataResponse.prototype.getTotalRows = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.GetTableDataResponse} returns this
 */
proto.gogent.GetTableDataResponse.prototype.setTotalRows = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.HealthRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.HealthRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.HealthRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.HealthRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.HealthRequest}
 */
proto.gogent.HealthRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.HealthRequest;
  return proto.gogent.HealthRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.HealthRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.HealthRequest}
 */
proto.gogent.HealthRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.HealthRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.HealthRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.HealthRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.HealthRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.HealthResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.HealthResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.HealthResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.HealthResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
status: jspb.Message.getFieldWithDefault(msg, 1, ""),
version: jspb.Message.getFieldWithDefault(msg, 2, ""),
timestamp: (f = msg.getTimestamp()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
database: jspb.Message.getBooleanFieldWithDefault(msg, 4, false),
geminiApi: jspb.Message.getBooleanFieldWithDefault(msg, 5, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.HealthResponse}
 */
proto.gogent.HealthResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.HealthResponse;
  return proto.gogent.HealthResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.HealthResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.HealthResponse}
 */
proto.gogent.HealthResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    case 3:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setTimestamp(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setDatabase(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setGeminiApi(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.HealthResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.HealthResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.HealthResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.HealthResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTimestamp();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getDatabase();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
  f = message.getGeminiApi();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
};


/**
 * optional string status = 1;
 * @return {string}
 */
proto.gogent.HealthResponse.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.HealthResponse} returns this
 */
proto.gogent.HealthResponse.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string version = 2;
 * @return {string}
 */
proto.gogent.HealthResponse.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.HealthResponse} returns this
 */
proto.gogent.HealthResponse.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional google.protobuf.Timestamp timestamp = 3;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.HealthResponse.prototype.getTimestamp = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 3));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.HealthResponse} returns this
*/
proto.gogent.HealthResponse.prototype.setTimestamp = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.HealthResponse} returns this
 */
proto.gogent.HealthResponse.prototype.clearTimestamp = function() {
  return this.setTimestamp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.HealthResponse.prototype.hasTimestamp = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional bool database = 4;
 * @return {boolean}
 */
proto.gogent.HealthResponse.prototype.getDatabase = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.HealthResponse} returns this
 */
proto.gogent.HealthResponse.prototype.setDatabase = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};


/**
 * optional bool gemini_api = 5;
 * @return {boolean}
 */
proto.gogent.HealthResponse.prototype.getGeminiApi = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.HealthResponse} returns this
 */
proto.gogent.HealthResponse.prototype.setGeminiApi = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ExecutionRun.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ExecutionRun.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ExecutionRun} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionRun.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
userId: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
description: jspb.Message.getFieldWithDefault(msg, 4, ""),
enableFunctionCalling: jspb.Message.getBooleanFieldWithDefault(msg, 5, false),
status: jspb.Message.getFieldWithDefault(msg, 6, ""),
errorMessage: jspb.Message.getFieldWithDefault(msg, 7, ""),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
updatedAt: (f = msg.getUpdatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ExecutionRun}
 */
proto.gogent.ExecutionRun.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ExecutionRun;
  return proto.gogent.ExecutionRun.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ExecutionRun} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ExecutionRun}
 */
proto.gogent.ExecutionRun.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 5:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnableFunctionCalling(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorMessage(value);
      break;
    case 8:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    case 9:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ExecutionRun.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ExecutionRun.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ExecutionRun} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionRun.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getEnableFunctionCalling();
  if (f) {
    writer.writeBool(
      5,
      f
    );
  }
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getErrorMessage();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getUpdatedAt();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string user_id = 2;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string description = 4;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional bool enable_function_calling = 5;
 * @return {boolean}
 */
proto.gogent.ExecutionRun.prototype.getEnableFunctionCalling = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 5, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setEnableFunctionCalling = function(value) {
  return jspb.Message.setProto3BooleanField(this, 5, value);
};


/**
 * optional string status = 6;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string error_message = 7;
 * @return {string}
 */
proto.gogent.ExecutionRun.prototype.getErrorMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.setErrorMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional google.protobuf.Timestamp created_at = 8;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.ExecutionRun.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 8));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.ExecutionRun} returns this
*/
proto.gogent.ExecutionRun.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionRun.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional google.protobuf.Timestamp updated_at = 9;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.ExecutionRun.prototype.getUpdatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 9));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.ExecutionRun} returns this
*/
proto.gogent.ExecutionRun.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionRun} returns this
 */
proto.gogent.ExecutionRun.prototype.clearUpdatedAt = function() {
  return this.setUpdatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionRun.prototype.hasUpdatedAt = function() {
  return jspb.Message.getField(this, 9) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.APIConfiguration.repeatedFields_ = [12];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.APIConfiguration.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.APIConfiguration.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.APIConfiguration} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIConfiguration.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
executionRunId: jspb.Message.getFieldWithDefault(msg, 2, ""),
variationName: jspb.Message.getFieldWithDefault(msg, 3, ""),
modelName: jspb.Message.getFieldWithDefault(msg, 4, ""),
systemPrompt: jspb.Message.getFieldWithDefault(msg, 5, ""),
temperature: jspb.Message.getFloatingPointFieldWithDefault(msg, 6, 0.0),
maxTokens: jspb.Message.getFieldWithDefault(msg, 7, 0),
topP: jspb.Message.getFloatingPointFieldWithDefault(msg, 8, 0.0),
topK: jspb.Message.getFieldWithDefault(msg, 9, 0),
safetySettings: (f = msg.getSafetySettings()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
generationConfig: (f = msg.getGenerationConfig()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
toolsList: jspb.Message.toObjectList(msg.getToolsList(),
    proto.gogent.Tool.toObject, includeInstance),
toolConfig: (f = msg.getToolConfig()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.APIConfiguration}
 */
proto.gogent.APIConfiguration.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.APIConfiguration;
  return proto.gogent.APIConfiguration.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.APIConfiguration} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.APIConfiguration}
 */
proto.gogent.APIConfiguration.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariationName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setModelName(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setSystemPrompt(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setTemperature(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setMaxTokens(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setTopP(value);
      break;
    case 9:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTopK(value);
      break;
    case 10:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setSafetySettings(value);
      break;
    case 11:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setGenerationConfig(value);
      break;
    case 12:
      var value = new proto.gogent.Tool;
      reader.readMessage(value,proto.gogent.Tool.deserializeBinaryFromReader);
      msg.addTools(value);
      break;
    case 13:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setToolConfig(value);
      break;
    case 14:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.APIConfiguration.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.APIConfiguration.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.APIConfiguration} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIConfiguration.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVariationName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getModelName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getSystemPrompt();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getTemperature();
  if (f !== 0.0) {
    writer.writeFloat(
      6,
      f
    );
  }
  f = message.getMaxTokens();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getTopP();
  if (f !== 0.0) {
    writer.writeFloat(
      8,
      f
    );
  }
  f = message.getTopK();
  if (f !== 0) {
    writer.writeInt32(
      9,
      f
    );
  }
  f = message.getSafetySettings();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getGenerationConfig();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getToolsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      12,
      f,
      proto.gogent.Tool.serializeBinaryToWriter
    );
  }
  f = message.getToolConfig();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.APIConfiguration.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string execution_run_id = 2;
 * @return {string}
 */
proto.gogent.APIConfiguration.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string variation_name = 3;
 * @return {string}
 */
proto.gogent.APIConfiguration.prototype.getVariationName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setVariationName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string model_name = 4;
 * @return {string}
 */
proto.gogent.APIConfiguration.prototype.getModelName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setModelName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string system_prompt = 5;
 * @return {string}
 */
proto.gogent.APIConfiguration.prototype.getSystemPrompt = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setSystemPrompt = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional float temperature = 6;
 * @return {number}
 */
proto.gogent.APIConfiguration.prototype.getTemperature = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 6, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setTemperature = function(value) {
  return jspb.Message.setProto3FloatField(this, 6, value);
};


/**
 * optional int32 max_tokens = 7;
 * @return {number}
 */
proto.gogent.APIConfiguration.prototype.getMaxTokens = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setMaxTokens = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional float top_p = 8;
 * @return {number}
 */
proto.gogent.APIConfiguration.prototype.getTopP = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 8, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setTopP = function(value) {
  return jspb.Message.setProto3FloatField(this, 8, value);
};


/**
 * optional int32 top_k = 9;
 * @return {number}
 */
proto.gogent.APIConfiguration.prototype.getTopK = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.setTopK = function(value) {
  return jspb.Message.setProto3IntField(this, 9, value);
};


/**
 * optional google.protobuf.Struct safety_settings = 10;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIConfiguration.prototype.getSafetySettings = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 10));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIConfiguration} returns this
*/
proto.gogent.APIConfiguration.prototype.setSafetySettings = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.clearSafetySettings = function() {
  return this.setSafetySettings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIConfiguration.prototype.hasSafetySettings = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional google.protobuf.Struct generation_config = 11;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIConfiguration.prototype.getGenerationConfig = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 11));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIConfiguration} returns this
*/
proto.gogent.APIConfiguration.prototype.setGenerationConfig = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.clearGenerationConfig = function() {
  return this.setGenerationConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIConfiguration.prototype.hasGenerationConfig = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * repeated Tool tools = 12;
 * @return {!Array<!proto.gogent.Tool>}
 */
proto.gogent.APIConfiguration.prototype.getToolsList = function() {
  return /** @type{!Array<!proto.gogent.Tool>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.Tool, 12));
};


/**
 * @param {!Array<!proto.gogent.Tool>} value
 * @return {!proto.gogent.APIConfiguration} returns this
*/
proto.gogent.APIConfiguration.prototype.setToolsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 12, value);
};


/**
 * @param {!proto.gogent.Tool=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.Tool}
 */
proto.gogent.APIConfiguration.prototype.addTools = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 12, opt_value, proto.gogent.Tool, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.clearToolsList = function() {
  return this.setToolsList([]);
};


/**
 * optional google.protobuf.Struct tool_config = 13;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIConfiguration.prototype.getToolConfig = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 13));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIConfiguration} returns this
*/
proto.gogent.APIConfiguration.prototype.setToolConfig = function(value) {
  return jspb.Message.setWrapperField(this, 13, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.clearToolConfig = function() {
  return this.setToolConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIConfiguration.prototype.hasToolConfig = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional google.protobuf.Timestamp created_at = 14;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.APIConfiguration.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 14));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.APIConfiguration} returns this
*/
proto.gogent.APIConfiguration.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 14, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIConfiguration} returns this
 */
proto.gogent.APIConfiguration.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIConfiguration.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 14) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.Tool.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.Tool.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.Tool} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.Tool.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, ""),
description: jspb.Message.getFieldWithDefault(msg, 2, ""),
parameters: (f = msg.getParameters()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.Tool}
 */
proto.gogent.Tool.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.Tool;
  return proto.gogent.Tool.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.Tool} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.Tool}
 */
proto.gogent.Tool.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 3:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setParameters(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.Tool.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.Tool.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.Tool} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.Tool.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getParameters();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.gogent.Tool.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.Tool} returns this
 */
proto.gogent.Tool.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string description = 2;
 * @return {string}
 */
proto.gogent.Tool.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.Tool} returns this
 */
proto.gogent.Tool.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional google.protobuf.Struct parameters = 3;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.Tool.prototype.getParameters = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 3));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.Tool} returns this
*/
proto.gogent.Tool.prototype.setParameters = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.Tool} returns this
 */
proto.gogent.Tool.prototype.clearParameters = function() {
  return this.setParameters(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.Tool.prototype.hasParameters = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.FunctionDefinition.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.FunctionDefinition.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.FunctionDefinition} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.FunctionDefinition.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
userId: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
displayName: jspb.Message.getFieldWithDefault(msg, 4, ""),
description: jspb.Message.getFieldWithDefault(msg, 5, ""),
parametersSchema: (f = msg.getParametersSchema()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
mockResponse: (f = msg.getMockResponse()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
endpointUrl: jspb.Message.getFieldWithDefault(msg, 8, ""),
httpMethod: jspb.Message.getFieldWithDefault(msg, 9, ""),
headers: (f = msg.getHeaders()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
authConfig: (f = msg.getAuthConfig()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
isActive: jspb.Message.getBooleanFieldWithDefault(msg, 12, false),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
updatedAt: (f = msg.getUpdatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.FunctionDefinition}
 */
proto.gogent.FunctionDefinition.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.FunctionDefinition;
  return proto.gogent.FunctionDefinition.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.FunctionDefinition} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.FunctionDefinition}
 */
proto.gogent.FunctionDefinition.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDisplayName(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDescription(value);
      break;
    case 6:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setParametersSchema(value);
      break;
    case 7:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setMockResponse(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setEndpointUrl(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setHttpMethod(value);
      break;
    case 10:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setHeaders(value);
      break;
    case 11:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setAuthConfig(value);
      break;
    case 12:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIsActive(value);
      break;
    case 13:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    case 14:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.FunctionDefinition.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.FunctionDefinition.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.FunctionDefinition} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.FunctionDefinition.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDisplayName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getDescription();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getParametersSchema();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getMockResponse();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getEndpointUrl();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getHttpMethod();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getHeaders();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getAuthConfig();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getIsActive();
  if (f) {
    writer.writeBool(
      12,
      f
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getUpdatedAt();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string user_id = 2;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string display_name = 4;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getDisplayName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setDisplayName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string description = 5;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getDescription = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setDescription = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional google.protobuf.Struct parameters_schema = 6;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionDefinition.prototype.getParametersSchema = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 6));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setParametersSchema = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearParametersSchema = function() {
  return this.setParametersSchema(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasParametersSchema = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional google.protobuf.Struct mock_response = 7;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionDefinition.prototype.getMockResponse = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 7));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setMockResponse = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearMockResponse = function() {
  return this.setMockResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasMockResponse = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional string endpoint_url = 8;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getEndpointUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setEndpointUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional string http_method = 9;
 * @return {string}
 */
proto.gogent.FunctionDefinition.prototype.getHttpMethod = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setHttpMethod = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional google.protobuf.Struct headers = 10;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionDefinition.prototype.getHeaders = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 10));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setHeaders = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearHeaders = function() {
  return this.setHeaders(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasHeaders = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional google.protobuf.Struct auth_config = 11;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionDefinition.prototype.getAuthConfig = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 11));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setAuthConfig = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearAuthConfig = function() {
  return this.setAuthConfig(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasAuthConfig = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional bool is_active = 12;
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.getIsActive = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 12, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.setIsActive = function(value) {
  return jspb.Message.setProto3BooleanField(this, 12, value);
};


/**
 * optional google.protobuf.Timestamp created_at = 13;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.FunctionDefinition.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 13));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 13, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional google.protobuf.Timestamp updated_at = 14;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.FunctionDefinition.prototype.getUpdatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 14));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.FunctionDefinition} returns this
*/
proto.gogent.FunctionDefinition.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 14, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionDefinition} returns this
 */
proto.gogent.FunctionDefinition.prototype.clearUpdatedAt = function() {
  return this.setUpdatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionDefinition.prototype.hasUpdatedAt = function() {
  return jspb.Message.getField(this, 14) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.APIRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.APIRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.APIRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
executionRunId: jspb.Message.getFieldWithDefault(msg, 2, ""),
configurationId: jspb.Message.getFieldWithDefault(msg, 3, ""),
requestType: jspb.Message.getFieldWithDefault(msg, 4, ""),
prompt: jspb.Message.getFieldWithDefault(msg, 5, ""),
context: jspb.Message.getFieldWithDefault(msg, 6, ""),
functionName: jspb.Message.getFieldWithDefault(msg, 7, ""),
functionParameters: (f = msg.getFunctionParameters()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
requestHeaders: (f = msg.getRequestHeaders()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
requestBody: (f = msg.getRequestBody()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.APIRequest}
 */
proto.gogent.APIRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.APIRequest;
  return proto.gogent.APIRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.APIRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.APIRequest}
 */
proto.gogent.APIRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setConfigurationId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setRequestType(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setPrompt(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setContext(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setFunctionName(value);
      break;
    case 8:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFunctionParameters(value);
      break;
    case 9:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setRequestHeaders(value);
      break;
    case 10:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setRequestBody(value);
      break;
    case 11:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.APIRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.APIRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.APIRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConfigurationId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getRequestType();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getPrompt();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getContext();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getFunctionName();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getFunctionParameters();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getRequestHeaders();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getRequestBody();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string execution_run_id = 2;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string configuration_id = 3;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getConfigurationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setConfigurationId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string request_type = 4;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getRequestType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setRequestType = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string prompt = 5;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getPrompt = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setPrompt = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string context = 6;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getContext = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setContext = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string function_name = 7;
 * @return {string}
 */
proto.gogent.APIRequest.prototype.getFunctionName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.setFunctionName = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional google.protobuf.Struct function_parameters = 8;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIRequest.prototype.getFunctionParameters = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 8));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIRequest} returns this
*/
proto.gogent.APIRequest.prototype.setFunctionParameters = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.clearFunctionParameters = function() {
  return this.setFunctionParameters(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIRequest.prototype.hasFunctionParameters = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional google.protobuf.Struct request_headers = 9;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIRequest.prototype.getRequestHeaders = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 9));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIRequest} returns this
*/
proto.gogent.APIRequest.prototype.setRequestHeaders = function(value) {
  return jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.clearRequestHeaders = function() {
  return this.setRequestHeaders(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIRequest.prototype.hasRequestHeaders = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional google.protobuf.Struct request_body = 10;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIRequest.prototype.getRequestBody = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 10));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIRequest} returns this
*/
proto.gogent.APIRequest.prototype.setRequestBody = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.clearRequestBody = function() {
  return this.setRequestBody(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIRequest.prototype.hasRequestBody = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional google.protobuf.Timestamp created_at = 11;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.APIRequest.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 11));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.APIRequest} returns this
*/
proto.gogent.APIRequest.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIRequest} returns this
 */
proto.gogent.APIRequest.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIRequest.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 11) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.APIResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.APIResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.APIResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
requestId: jspb.Message.getFieldWithDefault(msg, 2, ""),
responseStatus: jspb.Message.getFieldWithDefault(msg, 3, ""),
responseText: jspb.Message.getFieldWithDefault(msg, 4, ""),
functionCallResponse: (f = msg.getFunctionCallResponse()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
usageMetadata: (f = msg.getUsageMetadata()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
safetyRatings: (f = msg.getSafetyRatings()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
finishReason: jspb.Message.getFieldWithDefault(msg, 8, ""),
errorMessage: jspb.Message.getFieldWithDefault(msg, 9, ""),
responseTimeMs: jspb.Message.getFieldWithDefault(msg, 10, 0),
responseHeaders: (f = msg.getResponseHeaders()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
responseBody: (f = msg.getResponseBody()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.APIResponse}
 */
proto.gogent.APIResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.APIResponse;
  return proto.gogent.APIResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.APIResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.APIResponse}
 */
proto.gogent.APIResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setRequestId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setResponseStatus(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setResponseText(value);
      break;
    case 5:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFunctionCallResponse(value);
      break;
    case 6:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setUsageMetadata(value);
      break;
    case 7:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setSafetyRatings(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setFinishReason(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorMessage(value);
      break;
    case 10:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setResponseTimeMs(value);
      break;
    case 11:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setResponseHeaders(value);
      break;
    case 12:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setResponseBody(value);
      break;
    case 13:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.APIResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.APIResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.APIResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.APIResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRequestId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getResponseStatus();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getResponseText();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getFunctionCallResponse();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getUsageMetadata();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getSafetyRatings();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getFinishReason();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getErrorMessage();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getResponseTimeMs();
  if (f !== 0) {
    writer.writeInt32(
      10,
      f
    );
  }
  f = message.getResponseHeaders();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getResponseBody();
  if (f != null) {
    writer.writeMessage(
      12,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string request_id = 2;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getRequestId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setRequestId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string response_status = 3;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getResponseStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setResponseStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string response_text = 4;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getResponseText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setResponseText = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional google.protobuf.Struct function_call_response = 5;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIResponse.prototype.getFunctionCallResponse = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 5));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setFunctionCallResponse = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearFunctionCallResponse = function() {
  return this.setFunctionCallResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasFunctionCallResponse = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional google.protobuf.Struct usage_metadata = 6;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIResponse.prototype.getUsageMetadata = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 6));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setUsageMetadata = function(value) {
  return jspb.Message.setWrapperField(this, 6, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearUsageMetadata = function() {
  return this.setUsageMetadata(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasUsageMetadata = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional google.protobuf.Struct safety_ratings = 7;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIResponse.prototype.getSafetyRatings = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 7));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setSafetyRatings = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearSafetyRatings = function() {
  return this.setSafetyRatings(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasSafetyRatings = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional string finish_reason = 8;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getFinishReason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setFinishReason = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional string error_message = 9;
 * @return {string}
 */
proto.gogent.APIResponse.prototype.getErrorMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setErrorMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional int32 response_time_ms = 10;
 * @return {number}
 */
proto.gogent.APIResponse.prototype.getResponseTimeMs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 10, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.setResponseTimeMs = function(value) {
  return jspb.Message.setProto3IntField(this, 10, value);
};


/**
 * optional google.protobuf.Struct response_headers = 11;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIResponse.prototype.getResponseHeaders = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 11));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setResponseHeaders = function(value) {
  return jspb.Message.setWrapperField(this, 11, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearResponseHeaders = function() {
  return this.setResponseHeaders(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasResponseHeaders = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional google.protobuf.Struct response_body = 12;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.APIResponse.prototype.getResponseBody = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 12));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setResponseBody = function(value) {
  return jspb.Message.setWrapperField(this, 12, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearResponseBody = function() {
  return this.setResponseBody(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasResponseBody = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional google.protobuf.Timestamp created_at = 13;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.APIResponse.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 13));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.APIResponse} returns this
*/
proto.gogent.APIResponse.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 13, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.APIResponse} returns this
 */
proto.gogent.APIResponse.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.APIResponse.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 13) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.FunctionCall.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.FunctionCall.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.FunctionCall} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.FunctionCall.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
requestId: jspb.Message.getFieldWithDefault(msg, 2, ""),
functionName: jspb.Message.getFieldWithDefault(msg, 3, ""),
functionArguments: (f = msg.getFunctionArguments()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
functionResponse: (f = msg.getFunctionResponse()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
executionStatus: jspb.Message.getFieldWithDefault(msg, 6, ""),
executionTimeMs: jspb.Message.getFieldWithDefault(msg, 7, 0),
errorDetails: jspb.Message.getFieldWithDefault(msg, 8, ""),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.FunctionCall}
 */
proto.gogent.FunctionCall.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.FunctionCall;
  return proto.gogent.FunctionCall.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.FunctionCall} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.FunctionCall}
 */
proto.gogent.FunctionCall.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setRequestId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setFunctionName(value);
      break;
    case 4:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFunctionArguments(value);
      break;
    case 5:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setFunctionResponse(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionStatus(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setExecutionTimeMs(value);
      break;
    case 8:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorDetails(value);
      break;
    case 9:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.FunctionCall.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.FunctionCall.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.FunctionCall} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.FunctionCall.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRequestId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getFunctionName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getFunctionArguments();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getFunctionResponse();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getExecutionStatus();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getExecutionTimeMs();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getErrorDetails();
  if (f.length > 0) {
    writer.writeString(
      8,
      f
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.FunctionCall.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string request_id = 2;
 * @return {string}
 */
proto.gogent.FunctionCall.prototype.getRequestId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setRequestId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string function_name = 3;
 * @return {string}
 */
proto.gogent.FunctionCall.prototype.getFunctionName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setFunctionName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional google.protobuf.Struct function_arguments = 4;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionCall.prototype.getFunctionArguments = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 4));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionCall} returns this
*/
proto.gogent.FunctionCall.prototype.setFunctionArguments = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.clearFunctionArguments = function() {
  return this.setFunctionArguments(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionCall.prototype.hasFunctionArguments = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional google.protobuf.Struct function_response = 5;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.FunctionCall.prototype.getFunctionResponse = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 5));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.FunctionCall} returns this
*/
proto.gogent.FunctionCall.prototype.setFunctionResponse = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.clearFunctionResponse = function() {
  return this.setFunctionResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionCall.prototype.hasFunctionResponse = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string execution_status = 6;
 * @return {string}
 */
proto.gogent.FunctionCall.prototype.getExecutionStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setExecutionStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional int32 execution_time_ms = 7;
 * @return {number}
 */
proto.gogent.FunctionCall.prototype.getExecutionTimeMs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setExecutionTimeMs = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional string error_details = 8;
 * @return {string}
 */
proto.gogent.FunctionCall.prototype.getErrorDetails = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 8, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.setErrorDetails = function(value) {
  return jspb.Message.setProto3StringField(this, 8, value);
};


/**
 * optional google.protobuf.Timestamp created_at = 9;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.FunctionCall.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 9));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.FunctionCall} returns this
*/
proto.gogent.FunctionCall.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.FunctionCall} returns this
 */
proto.gogent.FunctionCall.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.FunctionCall.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 9) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ExecutionResult.repeatedFields_ = [2,7];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ExecutionResult.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ExecutionResult.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ExecutionResult} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionResult.toObject = function(includeInstance, msg) {
  var f, obj = {
executionRun: (f = msg.getExecutionRun()) && proto.gogent.ExecutionRun.toObject(includeInstance, f),
resultsList: jspb.Message.toObjectList(msg.getResultsList(),
    proto.gogent.VariationResult.toObject, includeInstance),
comparison: (f = msg.getComparison()) && proto.gogent.ComparisonResult.toObject(includeInstance, f),
totalTime: jspb.Message.getFieldWithDefault(msg, 4, 0),
successCount: jspb.Message.getFieldWithDefault(msg, 5, 0),
errorCount: jspb.Message.getFieldWithDefault(msg, 6, 0),
logsList: jspb.Message.toObjectList(msg.getLogsList(),
    proto.gogent.ExecutionLog.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ExecutionResult}
 */
proto.gogent.ExecutionResult.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ExecutionResult;
  return proto.gogent.ExecutionResult.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ExecutionResult} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ExecutionResult}
 */
proto.gogent.ExecutionResult.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.ExecutionRun;
      reader.readMessage(value,proto.gogent.ExecutionRun.deserializeBinaryFromReader);
      msg.setExecutionRun(value);
      break;
    case 2:
      var value = new proto.gogent.VariationResult;
      reader.readMessage(value,proto.gogent.VariationResult.deserializeBinaryFromReader);
      msg.addResults(value);
      break;
    case 3:
      var value = new proto.gogent.ComparisonResult;
      reader.readMessage(value,proto.gogent.ComparisonResult.deserializeBinaryFromReader);
      msg.setComparison(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTotalTime(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setSuccessCount(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setErrorCount(value);
      break;
    case 7:
      var value = new proto.gogent.ExecutionLog;
      reader.readMessage(value,proto.gogent.ExecutionLog.deserializeBinaryFromReader);
      msg.addLogs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ExecutionResult.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ExecutionResult.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ExecutionResult} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionResult.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getExecutionRun();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.ExecutionRun.serializeBinaryToWriter
    );
  }
  f = message.getResultsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.gogent.VariationResult.serializeBinaryToWriter
    );
  }
  f = message.getComparison();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.gogent.ComparisonResult.serializeBinaryToWriter
    );
  }
  f = message.getTotalTime();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getSuccessCount();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getErrorCount();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
  f = message.getLogsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.gogent.ExecutionLog.serializeBinaryToWriter
    );
  }
};


/**
 * optional ExecutionRun execution_run = 1;
 * @return {?proto.gogent.ExecutionRun}
 */
proto.gogent.ExecutionResult.prototype.getExecutionRun = function() {
  return /** @type{?proto.gogent.ExecutionRun} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ExecutionRun, 1));
};


/**
 * @param {?proto.gogent.ExecutionRun|undefined} value
 * @return {!proto.gogent.ExecutionResult} returns this
*/
proto.gogent.ExecutionResult.prototype.setExecutionRun = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.clearExecutionRun = function() {
  return this.setExecutionRun(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionResult.prototype.hasExecutionRun = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated VariationResult results = 2;
 * @return {!Array<!proto.gogent.VariationResult>}
 */
proto.gogent.ExecutionResult.prototype.getResultsList = function() {
  return /** @type{!Array<!proto.gogent.VariationResult>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.VariationResult, 2));
};


/**
 * @param {!Array<!proto.gogent.VariationResult>} value
 * @return {!proto.gogent.ExecutionResult} returns this
*/
proto.gogent.ExecutionResult.prototype.setResultsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.gogent.VariationResult=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.VariationResult}
 */
proto.gogent.ExecutionResult.prototype.addResults = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.gogent.VariationResult, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.clearResultsList = function() {
  return this.setResultsList([]);
};


/**
 * optional ComparisonResult comparison = 3;
 * @return {?proto.gogent.ComparisonResult}
 */
proto.gogent.ExecutionResult.prototype.getComparison = function() {
  return /** @type{?proto.gogent.ComparisonResult} */ (
    jspb.Message.getWrapperField(this, proto.gogent.ComparisonResult, 3));
};


/**
 * @param {?proto.gogent.ComparisonResult|undefined} value
 * @return {!proto.gogent.ExecutionResult} returns this
*/
proto.gogent.ExecutionResult.prototype.setComparison = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.clearComparison = function() {
  return this.setComparison(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionResult.prototype.hasComparison = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional int64 total_time = 4;
 * @return {number}
 */
proto.gogent.ExecutionResult.prototype.getTotalTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.setTotalTime = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 success_count = 5;
 * @return {number}
 */
proto.gogent.ExecutionResult.prototype.getSuccessCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.setSuccessCount = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 error_count = 6;
 * @return {number}
 */
proto.gogent.ExecutionResult.prototype.getErrorCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.setErrorCount = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * repeated ExecutionLog logs = 7;
 * @return {!Array<!proto.gogent.ExecutionLog>}
 */
proto.gogent.ExecutionResult.prototype.getLogsList = function() {
  return /** @type{!Array<!proto.gogent.ExecutionLog>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.ExecutionLog, 7));
};


/**
 * @param {!Array<!proto.gogent.ExecutionLog>} value
 * @return {!proto.gogent.ExecutionResult} returns this
*/
proto.gogent.ExecutionResult.prototype.setLogsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.gogent.ExecutionLog=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.ExecutionLog}
 */
proto.gogent.ExecutionResult.prototype.addLogs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.gogent.ExecutionLog, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ExecutionResult} returns this
 */
proto.gogent.ExecutionResult.prototype.clearLogsList = function() {
  return this.setLogsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.VariationResult.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.VariationResult.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.VariationResult.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.VariationResult} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VariationResult.toObject = function(includeInstance, msg) {
  var f, obj = {
configuration: (f = msg.getConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f),
request: (f = msg.getRequest()) && proto.gogent.APIRequest.toObject(includeInstance, f),
response: (f = msg.getResponse()) && proto.gogent.APIResponse.toObject(includeInstance, f),
functionCallsList: jspb.Message.toObjectList(msg.getFunctionCallsList(),
    proto.gogent.FunctionCall.toObject, includeInstance),
executionTime: jspb.Message.getFieldWithDefault(msg, 5, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.VariationResult}
 */
proto.gogent.VariationResult.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.VariationResult;
  return proto.gogent.VariationResult.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.VariationResult} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.VariationResult}
 */
proto.gogent.VariationResult.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setConfiguration(value);
      break;
    case 2:
      var value = new proto.gogent.APIRequest;
      reader.readMessage(value,proto.gogent.APIRequest.deserializeBinaryFromReader);
      msg.setRequest(value);
      break;
    case 3:
      var value = new proto.gogent.APIResponse;
      reader.readMessage(value,proto.gogent.APIResponse.deserializeBinaryFromReader);
      msg.setResponse(value);
      break;
    case 4:
      var value = new proto.gogent.FunctionCall;
      reader.readMessage(value,proto.gogent.FunctionCall.deserializeBinaryFromReader);
      msg.addFunctionCalls(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setExecutionTime(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.VariationResult.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.VariationResult.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.VariationResult} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.VariationResult.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getConfiguration();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
  f = message.getRequest();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gogent.APIRequest.serializeBinaryToWriter
    );
  }
  f = message.getResponse();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.gogent.APIResponse.serializeBinaryToWriter
    );
  }
  f = message.getFunctionCallsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.gogent.FunctionCall.serializeBinaryToWriter
    );
  }
  f = message.getExecutionTime();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
};


/**
 * optional APIConfiguration configuration = 1;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.VariationResult.prototype.getConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 1));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.VariationResult} returns this
*/
proto.gogent.VariationResult.prototype.setConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.VariationResult} returns this
 */
proto.gogent.VariationResult.prototype.clearConfiguration = function() {
  return this.setConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.VariationResult.prototype.hasConfiguration = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional APIRequest request = 2;
 * @return {?proto.gogent.APIRequest}
 */
proto.gogent.VariationResult.prototype.getRequest = function() {
  return /** @type{?proto.gogent.APIRequest} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIRequest, 2));
};


/**
 * @param {?proto.gogent.APIRequest|undefined} value
 * @return {!proto.gogent.VariationResult} returns this
*/
proto.gogent.VariationResult.prototype.setRequest = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.VariationResult} returns this
 */
proto.gogent.VariationResult.prototype.clearRequest = function() {
  return this.setRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.VariationResult.prototype.hasRequest = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional APIResponse response = 3;
 * @return {?proto.gogent.APIResponse}
 */
proto.gogent.VariationResult.prototype.getResponse = function() {
  return /** @type{?proto.gogent.APIResponse} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIResponse, 3));
};


/**
 * @param {?proto.gogent.APIResponse|undefined} value
 * @return {!proto.gogent.VariationResult} returns this
*/
proto.gogent.VariationResult.prototype.setResponse = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.VariationResult} returns this
 */
proto.gogent.VariationResult.prototype.clearResponse = function() {
  return this.setResponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.VariationResult.prototype.hasResponse = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * repeated FunctionCall function_calls = 4;
 * @return {!Array<!proto.gogent.FunctionCall>}
 */
proto.gogent.VariationResult.prototype.getFunctionCallsList = function() {
  return /** @type{!Array<!proto.gogent.FunctionCall>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.FunctionCall, 4));
};


/**
 * @param {!Array<!proto.gogent.FunctionCall>} value
 * @return {!proto.gogent.VariationResult} returns this
*/
proto.gogent.VariationResult.prototype.setFunctionCallsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.gogent.FunctionCall=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.FunctionCall}
 */
proto.gogent.VariationResult.prototype.addFunctionCalls = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.gogent.FunctionCall, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.VariationResult} returns this
 */
proto.gogent.VariationResult.prototype.clearFunctionCallsList = function() {
  return this.setFunctionCallsList([]);
};


/**
 * optional int64 execution_time = 5;
 * @return {number}
 */
proto.gogent.VariationResult.prototype.getExecutionTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.gogent.VariationResult} returns this
 */
proto.gogent.VariationResult.prototype.setExecutionTime = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ComparisonResult.repeatedFields_ = [8];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ComparisonResult.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ComparisonResult.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ComparisonResult} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ComparisonResult.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
executionRunId: jspb.Message.getFieldWithDefault(msg, 2, ""),
comparisonType: jspb.Message.getFieldWithDefault(msg, 3, ""),
metricName: jspb.Message.getFieldWithDefault(msg, 4, ""),
configurationScores: (f = msg.getConfigurationScores()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
bestConfigurationId: jspb.Message.getFieldWithDefault(msg, 6, ""),
bestConfiguration: (f = msg.getBestConfiguration()) && proto.gogent.APIConfiguration.toObject(includeInstance, f),
allConfigurationsList: jspb.Message.toObjectList(msg.getAllConfigurationsList(),
    proto.gogent.APIConfiguration.toObject, includeInstance),
analysisNotes: jspb.Message.getFieldWithDefault(msg, 9, ""),
createdAt: (f = msg.getCreatedAt()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ComparisonResult}
 */
proto.gogent.ComparisonResult.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ComparisonResult;
  return proto.gogent.ComparisonResult.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ComparisonResult} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ComparisonResult}
 */
proto.gogent.ComparisonResult.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setComparisonType(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setMetricName(value);
      break;
    case 5:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setConfigurationScores(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setBestConfigurationId(value);
      break;
    case 7:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.setBestConfiguration(value);
      break;
    case 8:
      var value = new proto.gogent.APIConfiguration;
      reader.readMessage(value,proto.gogent.APIConfiguration.deserializeBinaryFromReader);
      msg.addAllConfigurations(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setAnalysisNotes(value);
      break;
    case 10:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setCreatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ComparisonResult.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ComparisonResult.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ComparisonResult} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ComparisonResult.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getComparisonType();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getMetricName();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getConfigurationScores();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getBestConfigurationId();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getBestConfiguration();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
  f = message.getAllConfigurationsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      8,
      f,
      proto.gogent.APIConfiguration.serializeBinaryToWriter
    );
  }
  f = message.getAnalysisNotes();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getCreatedAt();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string execution_run_id = 2;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string comparison_type = 3;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getComparisonType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setComparisonType = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string metric_name = 4;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getMetricName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setMetricName = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional google.protobuf.Struct configuration_scores = 5;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.ComparisonResult.prototype.getConfigurationScores = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 5));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.ComparisonResult} returns this
*/
proto.gogent.ComparisonResult.prototype.setConfigurationScores = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.clearConfigurationScores = function() {
  return this.setConfigurationScores(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ComparisonResult.prototype.hasConfigurationScores = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional string best_configuration_id = 6;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getBestConfigurationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setBestConfigurationId = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional APIConfiguration best_configuration = 7;
 * @return {?proto.gogent.APIConfiguration}
 */
proto.gogent.ComparisonResult.prototype.getBestConfiguration = function() {
  return /** @type{?proto.gogent.APIConfiguration} */ (
    jspb.Message.getWrapperField(this, proto.gogent.APIConfiguration, 7));
};


/**
 * @param {?proto.gogent.APIConfiguration|undefined} value
 * @return {!proto.gogent.ComparisonResult} returns this
*/
proto.gogent.ComparisonResult.prototype.setBestConfiguration = function(value) {
  return jspb.Message.setWrapperField(this, 7, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.clearBestConfiguration = function() {
  return this.setBestConfiguration(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ComparisonResult.prototype.hasBestConfiguration = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * repeated APIConfiguration all_configurations = 8;
 * @return {!Array<!proto.gogent.APIConfiguration>}
 */
proto.gogent.ComparisonResult.prototype.getAllConfigurationsList = function() {
  return /** @type{!Array<!proto.gogent.APIConfiguration>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gogent.APIConfiguration, 8));
};


/**
 * @param {!Array<!proto.gogent.APIConfiguration>} value
 * @return {!proto.gogent.ComparisonResult} returns this
*/
proto.gogent.ComparisonResult.prototype.setAllConfigurationsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 8, value);
};


/**
 * @param {!proto.gogent.APIConfiguration=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gogent.APIConfiguration}
 */
proto.gogent.ComparisonResult.prototype.addAllConfigurations = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 8, opt_value, proto.gogent.APIConfiguration, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.clearAllConfigurationsList = function() {
  return this.setAllConfigurationsList([]);
};


/**
 * optional string analysis_notes = 9;
 * @return {string}
 */
proto.gogent.ComparisonResult.prototype.getAnalysisNotes = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.setAnalysisNotes = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional google.protobuf.Timestamp created_at = 10;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.ComparisonResult.prototype.getCreatedAt = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 10));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.ComparisonResult} returns this
*/
proto.gogent.ComparisonResult.prototype.setCreatedAt = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ComparisonResult} returns this
 */
proto.gogent.ComparisonResult.prototype.clearCreatedAt = function() {
  return this.setCreatedAt(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ComparisonResult.prototype.hasCreatedAt = function() {
  return jspb.Message.getField(this, 10) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ExecutionLog.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ExecutionLog.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ExecutionLog} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionLog.toObject = function(includeInstance, msg) {
  var f, obj = {
id: jspb.Message.getFieldWithDefault(msg, 1, ""),
executionRunId: jspb.Message.getFieldWithDefault(msg, 2, ""),
configurationId: jspb.Message.getFieldWithDefault(msg, 3, ""),
requestId: jspb.Message.getFieldWithDefault(msg, 4, ""),
logLevel: jspb.Message.getFieldWithDefault(msg, 5, ""),
logCategory: jspb.Message.getFieldWithDefault(msg, 6, ""),
message: jspb.Message.getFieldWithDefault(msg, 7, ""),
details: (f = msg.getDetails()) && google_protobuf_struct_pb.Struct.toObject(includeInstance, f),
timestamp: (f = msg.getTimestamp()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ExecutionLog}
 */
proto.gogent.ExecutionLog.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ExecutionLog;
  return proto.gogent.ExecutionLog.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ExecutionLog} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ExecutionLog}
 */
proto.gogent.ExecutionLog.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExecutionRunId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setConfigurationId(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setRequestId(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setLogLevel(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setLogCategory(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    case 8:
      var value = new google_protobuf_struct_pb.Struct;
      reader.readMessage(value,google_protobuf_struct_pb.Struct.deserializeBinaryFromReader);
      msg.setDetails(value);
      break;
    case 9:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setTimestamp(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ExecutionLog.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ExecutionLog.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ExecutionLog} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ExecutionLog.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExecutionRunId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getConfigurationId();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getRequestId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getLogLevel();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getLogCategory();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getDetails();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      google_protobuf_struct_pb.Struct.serializeBinaryToWriter
    );
  }
  f = message.getTimestamp();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional string id = 1;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string execution_run_id = 2;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getExecutionRunId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setExecutionRunId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string configuration_id = 3;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getConfigurationId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setConfigurationId = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string request_id = 4;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getRequestId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setRequestId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string log_level = 5;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getLogLevel = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setLogLevel = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string log_category = 6;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getLogCategory = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setLogCategory = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string message = 7;
 * @return {string}
 */
proto.gogent.ExecutionLog.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional google.protobuf.Struct details = 8;
 * @return {?proto.google.protobuf.Struct}
 */
proto.gogent.ExecutionLog.prototype.getDetails = function() {
  return /** @type{?proto.google.protobuf.Struct} */ (
    jspb.Message.getWrapperField(this, google_protobuf_struct_pb.Struct, 8));
};


/**
 * @param {?proto.google.protobuf.Struct|undefined} value
 * @return {!proto.gogent.ExecutionLog} returns this
*/
proto.gogent.ExecutionLog.prototype.setDetails = function(value) {
  return jspb.Message.setWrapperField(this, 8, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.clearDetails = function() {
  return this.setDetails(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionLog.prototype.hasDetails = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional google.protobuf.Timestamp timestamp = 9;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.gogent.ExecutionLog.prototype.getTimestamp = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 9));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.gogent.ExecutionLog} returns this
*/
proto.gogent.ExecutionLog.prototype.setTimestamp = function(value) {
  return jspb.Message.setWrapperField(this, 9, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gogent.ExecutionLog} returns this
 */
proto.gogent.ExecutionLog.prototype.clearTimestamp = function() {
  return this.setTimestamp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gogent.ExecutionLog.prototype.hasTimestamp = function() {
  return jspb.Message.getField(this, 9) != null;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gogent.ComparisonConfig.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gogent.ComparisonConfig.prototype.toObject = function(opt_includeInstance) {
  return proto.gogent.ComparisonConfig.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gogent.ComparisonConfig} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ComparisonConfig.toObject = function(includeInstance, msg) {
  var f, obj = {
enabled: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
metricsList: (f = jspb.Message.getRepeatedField(msg, 2)) == null ? undefined : f,
customRulesList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gogent.ComparisonConfig}
 */
proto.gogent.ComparisonConfig.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gogent.ComparisonConfig;
  return proto.gogent.ComparisonConfig.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gogent.ComparisonConfig} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gogent.ComparisonConfig}
 */
proto.gogent.ComparisonConfig.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnabled(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.addMetrics(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addCustomRules(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gogent.ComparisonConfig.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gogent.ComparisonConfig.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gogent.ComparisonConfig} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gogent.ComparisonConfig.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnabled();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getMetricsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      2,
      f
    );
  }
  f = message.getCustomRulesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * optional bool enabled = 1;
 * @return {boolean}
 */
proto.gogent.ComparisonConfig.prototype.getEnabled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.setEnabled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * repeated string metrics = 2;
 * @return {!Array<string>}
 */
proto.gogent.ComparisonConfig.prototype.getMetricsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 2));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.setMetricsList = function(value) {
  return jspb.Message.setField(this, 2, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.addMetrics = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 2, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.clearMetricsList = function() {
  return this.setMetricsList([]);
};


/**
 * repeated string custom_rules = 3;
 * @return {!Array<string>}
 */
proto.gogent.ComparisonConfig.prototype.getCustomRulesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.setCustomRulesList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.addCustomRules = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gogent.ComparisonConfig} returns this
 */
proto.gogent.ComparisonConfig.prototype.clearCustomRulesList = function() {
  return this.setCustomRulesList([]);
};


goog.object.extend(exports, proto.gogent);
