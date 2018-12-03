/**
 * @file - EMSE_MA_INT_C_LICENSE:
 * This file contains the Script to provide License Configuration information on
 * the requested License types
 */
var SCRIPT_VERSION = "3.0";
var intLicenseTesting = false;
 var capTypeAlias;
   var licenseProfessional;
 var licExpirationDate;
if (intLicenseTesting) {

function getScriptText(vScriptName) {
        vScriptName = vScriptName.toUpperCase();
        var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
        var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),
                                         vScriptName, "ADMIN");
        return emseScript.getScriptText() + "";

}


/**
 * load Batch Common and EMSE Common JavaScript Files
 */



try {

	eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
	eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
	eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
	eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
	eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
	eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
	eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
	eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));	
	eval(getScriptText("INCLUDES_CUSTOM"));
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
}

/**
 * override logDebug() for ELPLogging applications
 * @param message
 */
function logDebug(message) {
	ELPLogging.debug(message);
}

/**
 * @desc returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
 * @param {Date} dateObj - JavaScript Date
 * @param {string} pFormat - Date format
 * @returns {string} Formatted Date
 */

function dateFormattedIntC(dateObj,pFormat){
	var mth = "";
	var day = "";
	var ret = "";
	if (dateObj == null) {
		return "";
	}
	if (dateObj.getMonth() >= 9) {
		mth = "" + (dateObj.getMonth()+1);
	} else {
		mth = "0" + (dateObj.getMonth()+1);
	}
	if (dateObj.getDate() > 9) {
		day = dateObj.getDate().toString();
	} else {
		day = "0"+dateObj.getDate().toString();
	}
	if (pFormat=="YYYY-MM-DD") {
		ret = dateObj.getFullYear().toString()+"-"+mth+"-"+day;
	} else if (pFormat == "MMDDYYYY") {
		ret = ""+mth+day+dateObj.getFullYear().toString();		
	} else if (pFormat == "YYYYMMDD") {
		ret = ""+dateObj.getFullYear().toString()+mth+day;		
	} else {
		ret = ""+mth+"/"+day+"/"+dateObj.getFullYear().toString();
	}

	return ret;
}

/**
 * These are symbolic constants for the expiration codes in b1_expiration.
 */
var LICENSE_EXPIRATION_CODES = {
		FEB28_1YR : "FEB 28 1YR",
		BIRTH28_2YR : "28TH BIRTH MONTH 2YR",
		DEC31_1YR : "DEC 31 1YR",
		ISSUE_2YR : "ISSUE DATE 2YR",
		JULY31_3YR :	"31ST JULY 3YR",
		MAY01_EVENYR : "MAY 01 EVENYR"
};

/**
 * This Object (Class) encapsulates the License configuration information and actions for
 * validating and issuing licenses for PSI exam applications/renewals.
 */
function LicenseData(databaseConnection, parameters) {
	this.dbConnection = databaseConnection;
	this.parameters = parameters;
	this.configurations = this.getLicenseData(parameters);
	
}

// POC
LicenseData.prototype.selectQueryConfiguration = {
        "selectQuery": {
            "table": "ELP_VW_LICENSE_CONFIG_DPL",
            "parameters": {
                "list": [{
                    "source": "RESULT",
                    "name": "servProvCode",
                    "parameterType": "IN",
                    "property": "servProvCode",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "applicationType",
                    "parameterType": "IN",
                    "property": "applicationType",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "applicationSubType",
                    "parameterType": "IN",
                    "property": "applicationSubType",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "SP_CURSOR",
                    "parameterType": "OUT",
                    "property": "SP_CURSOR",
                    "type": "RESULT_SET"
                }]
            },
            "resultSet": {
                "list": [{
                    "source": "RESULT",
                    "name": "servProvCode",
                    "parameterType": "OUT",
                    "property": "SERV_PROV_CODE",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "applicationType",
                    "parameterType": "OUT",
                    "property": "R1_PER_TYPE",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "applicationSubType",
                    "parameterType": "OUT",
                    "property": "R1_PER_SUB_TYPE",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "expirationCode",
                    "parameterType": "OUT",
                    "property": "EXPIRATION_CODE",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "description",
                    "parameterType": "OUT",
                    "property": "R1_APP_TYPE_ALIAS",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "expirationInterval",
                    "parameterType": "OUT",
                    "property": "EXPIRATION_INTERVAL",
                    "type": "INTEGER"
                }, {
                    "source": "RESULT",
                    "name": "expirationUnits",
                    "parameterType": "OUT",
                    "property": "EXPIRATION_INTERVAL_UNITS",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "expirationMonth",
                    "parameterType": "OUT",
                    "property": "EXPIRATION_MONTH",
                    "type": "INTEGER"
                }, {
                    "source": "RESULT",
                    "name": "expirationDay",
                    "parameterType": "OUT",
                    "property": "EXPIRATION_DAY",
                    "type": "INTEGER"
                }, {
                    "source": "RESULT",
                    "name": "maskPattern",
                    "parameterType": "OUT",
                    "property": "MASK_PATTERN",
                    "type": "STRING"
                }, {
                    "source": "RESULT",
                    "name": "lastSequenceNbr",
                    "parameterType": "OUT",
                    "property": "SEQ_LAST_SEQ",
                    "type": "INTEGER"
                }]
            }
        }
};

LicenseData.prototype.getLicenseConfigurationRecords = function(parameters) {
    var dataSet = null;
    try {
        var sql = "select * from " + parameters["table"];
        var where = " where ";
        var stmt = null;

        if (parameters["applicationType"] == null && parameters["applicationSubType"] == null && parameters["servProvCode"] == null) {
            ELPLogging.error("**ERROR: All parameters values are null.");
            return null;
        }

        if (parameters["applicationType"] == null) {
            if (parameters["applicationType"] == null) {
                where += "serv_prov_code = '" + parameters["servProvCode"] + "'";
            } else {
                where += "serv_prov_code = '" + parameters["servProvCode"] + "' and r1_per_type = '" + parameters["applicationType"] + "'";
            }
        } else {
            where += "serv_prov_code = '" + parameters["servProvCode"] + "' and r1_per_type = '" + parameters["applicationType"] + "'" + " and r1_per_sub_type = '" + parameters["applicationSubType"] + "'";
        }
        sql += where;

        ELPLogging.debug("**INFO: SQL = " + sql);

        var stmt = dbConn.prepareStatement(sql);
        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(this.selectQueryConfiguration.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}

/**
 * This is the procedure configuration information. The Batch Common StoredProcedure Object 
 * uses this configuration to perform the stored procedures.
 */
LicenseData.prototype.procedureConfiguration = {
		"connectionInfoSC" : "DB_CONNECTION_INFO",		
		"supplemental": [
                  {
                      "tag": "licenseConfiguration",
                      "procedure": {
                          "name": "ELP_SP_LICENSE_CONFIG",
                          "parameters": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "IN",
                                  "property": "servProvCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "IN",
                                  "property": "applicationType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "IN",
                                  "property": "applicationSubType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "SP_CURSOR",
                                  "parameterType": "OUT",
                                  "property": "SP_CURSOR",
                                  "type": "RESULT_SET"
                              }
                          ]},
                          "resultSet": {"list": [
                                                 {
                                                     "source": "RESULT",
                                                     "name": "servProvCode",
                                                     "parameterType": "OUT",
                                                     "property": "SERV_PROV_CODE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "applicationType",
                                                     "parameterType": "OUT",
                                                     "property": "R1_PER_TYPE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "applicationSubType",
                                                     "parameterType": "OUT",
                                                     "property": "R1_PER_SUB_TYPE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationCode",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_CODE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "description",
                                                     "parameterType": "OUT",
                                                     "property": "R1_APP_TYPE_ALIAS",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationInterval",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_INTERVAL",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationUnits",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_INTERVAL_UNITS",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationMonth",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_MONTH",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationDay",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_DAY",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "maskPattern",
                                                     "parameterType": "OUT",
                                                     "property": "MASK_PATTERN",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "lastSequenceNbr",
                                                     "parameterType": "OUT",
                                                     "property": "SEQ_LAST_SEQ",
                                                     "type": "INTEGER"
                                                 }
                                             ]}                          
                      }
                  },
                  {
                      "tag": "licenseConfigurationDPL",
                      "procedure": {
                          "name": "ELP_SP_LICENSE_CONFIG_DPL",
                          "parameters": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "IN",
                                  "property": "servProvCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "IN",
                                  "property": "applicationType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "IN",
                                  "property": "applicationSubType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "SP_CURSOR",
                                  "parameterType": "OUT",
                                  "property": "SP_CURSOR",
                                  "type": "RESULT_SET"
                              }
                          ]},
                          "resultSet": {"list": [
                                                 {
                                                     "source": "RESULT",
                                                     "name": "servProvCode",
                                                     "parameterType": "OUT",
                                                     "property": "SERV_PROV_CODE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "applicationType",
                                                     "parameterType": "OUT",
                                                     "property": "R1_PER_TYPE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "applicationSubType",
                                                     "parameterType": "OUT",
                                                     "property": "R1_PER_SUB_TYPE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationCode",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_CODE",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "description",
                                                     "parameterType": "OUT",
                                                     "property": "R1_APP_TYPE_ALIAS",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationInterval",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_INTERVAL",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationUnits",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_INTERVAL_UNITS",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationMonth",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_MONTH",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "expirationDay",
                                                     "parameterType": "OUT",
                                                     "property": "EXPIRATION_DAY",
                                                     "type": "INTEGER"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "maskPattern",
                                                     "parameterType": "OUT",
                                                     "property": "MASK_PATTERN",
                                                     "type": "STRING"
                                                 },
                                                 {
                                                     "source": "RESULT",
                                                     "name": "lastSequenceNbr",
                                                     "parameterType": "OUT",
                                                     "property": "SEQ_LAST_SEQ",
                                                     "type": "INTEGER"
                                                 }
                                             ]}                          
                      }
                  },
                  {
                      "tag": "ELP_VW_LICENSE_CONFIG",
                      "procedure": {
                          "name": "ELP_VW_LICENSE_CONFIG",
                          "resultSet": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "OUT",
                                  "property": "SERV_PROV_CODE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "OUT",
                                  "property": "R1_PER_TYPE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "OUT",
                                  "property": "R1_PER_SUB_TYPE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationCode",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_CODE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "description",
                                  "parameterType": "OUT",
                                  "property": "R1_APP_TYPE_ALIAS",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationInterval",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_INTERVAL",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationUnits",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_INTERVAL_UNITS",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationMonth",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_MONTH",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationDay",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_DAY",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "maskPattern",
                                  "parameterType": "OUT",
                                  "property": "MASK_PATTERN",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "lastSequenceNbr",
                                  "parameterType": "OUT",
                                  "property": "SEQ_LAST_SEQ",
                                  "type": "INTEGER"
                              }
                          ]},
                          "parameters": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "IN",
                                  "property": "servProvCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "IN",
                                  "property": "applicationType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "IN",
                                  "property": "applicationSubType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationCode",
                                  "parameterType": "IN",
                                  "property": "expirationCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "description",
                                  "parameterType": "IN",
                                  "property": "description",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationInterval",
                                  "parameterType": "IN",
                                  "property": "expirationInterval",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationUnits",
                                  "parameterType": "IN",
                                  "property": "expirationUnits",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationMonth",
                                  "parameterType": "IN",
                                  "property": "expirationMonth",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationDay",
                                  "parameterType": "IN",
                                  "property": "expirationDay",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "maskPattern",
                                  "parameterType": "IN",
                                  "property": "maskPattern",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "lastSequenceNbr",
                                  "parameterType": "IN",
                                  "property": "lastSequenceNbr",
                                  "type": "INTEGER"
                              }
                          ]}
                      }
                  },
                  {
                      "tag": "ELP_VW_LICENSE_CONFIG_DPL",
                      "procedure": {
                          "name": "ELP_VW_LICENSE_CONFIG_DPL",
                          "resultSet": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "OUT",
                                  "property": "SERV_PROV_CODE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "OUT",
                                  "property": "R1_PER_TYPE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "OUT",
                                  "property": "R1_PER_SUB_TYPE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationCode",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_CODE",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "description",
                                  "parameterType": "OUT",
                                  "property": "R1_APP_TYPE_ALIAS",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationInterval",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_INTERVAL",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationUnits",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_INTERVAL_UNITS",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationMonth",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_MONTH",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationDay",
                                  "parameterType": "OUT",
                                  "property": "EXPIRATION_DAY",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "maskPattern",
                                  "parameterType": "OUT",
                                  "property": "MASK_PATTERN",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "lastSequenceNbr",
                                  "parameterType": "OUT",
                                  "property": "SEQ_LAST_SEQ",
                                  "type": "INTEGER"
                              }
                          ]},
                          "parameters": {"list": [
                              {
                                  "source": "RESULT",
                                  "name": "servProvCode",
                                  "parameterType": "IN",
                                  "property": "servProvCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationType",
                                  "parameterType": "IN",
                                  "property": "applicationType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "applicationSubType",
                                  "parameterType": "IN",
                                  "property": "applicationSubType",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationCode",
                                  "parameterType": "IN",
                                  "property": "expirationCode",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "description",
                                  "parameterType": "IN",
                                  "property": "description",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationInterval",
                                  "parameterType": "IN",
                                  "property": "expirationInterval",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationUnits",
                                  "parameterType": "IN",
                                  "property": "expirationUnits",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationMonth",
                                  "parameterType": "IN",
                                  "property": "expirationMonth",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "expirationDay",
                                  "parameterType": "IN",
                                  "property": "expirationDay",
                                  "type": "INTEGER"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "maskPattern",
                                  "parameterType": "IN",
                                  "property": "maskPattern",
                                  "type": "STRING"
                              },
                              {
                                  "source": "RESULT",
                                  "name": "lastSequenceNbr",
                                  "parameterType": "IN",
                                  "property": "lastSequenceNbr",
                                  "type": "INTEGER"
                              }
                          ]}
                      }
                  }
              ]};


/**
 * The function getLicenseData retrieves the License configuration information for the requested
 * Service Provider Code, Application Type (optional), and Application SubType (optional)
 * @param parameters - Object consisting of
 * 		servProvCode - Service Provider Code (required)
 * 		applicationType - Application Type (e.g., "Sheet Metal")	(optional)
 * 		applicationSubType - Application SubType (e.g., "Journeyperson") (optional)
 * @returns configurations - Object consisting of
 * 	{	
 * 		type1 : {
 * 			lastSequenceNbr : 221	// copied from SubType, one number for each Type
 * 			subType1 : {
 * 				servProvCode :				// Service Provider Code (DPL)
 * 				applicationType :			// Application Type (Sheet Metal)
 * 				applicationSubType :		// Application SubType (Journeyperson)
 * 				expirationCode :			// Expiration Code (28TH BIRTH MONTH 2YR)
 * 				description :				// Application Type Alias (Sheet Metal Journeyperson License)
 * 				expirationInterval :		// Expiration Interval, # of units (2)
 * 				expirationUnits :			// Expiration Units, Years, Months, Days (Years)
 * 				expirationMonth :			// Expiration Month, Code can override (1)
 * 				expirationDay :				// Expiration Day (28)
 * 				maskPattern :				// Mask Pattern, not used ($$SEQ$$-SM-J1)
 * 				lastSequenceNbr :			// Last Sequence Number used (221)
 * 			}
 * 			.....
 * 		}
 * 		.....
 * }
 * 				
 */
LicenseData.prototype.getLicenseData = function(parameters) {
	var returnException;
	var createConnection = false;

	try {
		if (this.dbConnection == null) {		
		/*
		 * get Standard Choice for Connection Infomation
		 */
		var connectionStandardChoice = getDBConnectionInfo(this.procedureConfiguration.connectionInfoSC);
		if (connectionStandardChoice == null) {
			var message = "Cannot find Connection Information Standard Choice: " + procedureConfiguration.connectionInfoSC;
		    returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
		    ELPLogging.fatal(returnException.toString());
		    throw returnException;		
		}
	    //Create a connection to the Staging Table Database
	    this.dbConnection = DBUtils.connectDB(connectionStandardChoice.connectionInfo);	
	    createConnection = true;
		}
		for (var ii = 0; ii < this.procedureConfiguration.supplemental.length; ii++) {
		var supplementalConfiguration = this.procedureConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "licenseConfigurationDPL") {
			var getLicenseConfigurationProcedure = new StoredProcedure(supplementalConfiguration.procedure, this.dbConnection); 
			break;
		}
	}

	if (getLicenseConfigurationProcedure == null ) {
		var message = "Cannot find all required supplemental stored procedures in the database for this interface.";
	    returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
	    ELPLogging.fatal(returnException.toString());
	    throw returnException;		
	}
	
	ELPLogging.debug("*** Start getLicenseConfigurationRecords() ***");

    // POC
    parameters["table"] = this.selectQueryConfiguration.selectQuery.table;
    var dataSet = this.getLicenseConfigurationRecords(parameters);

    // POC
 //    getLicenseConfigurationProcedure.prepareStatement();
	// var inputParameters = getLicenseConfigurationProcedure.prepareParameters(null,null,parameters);
	// ELPLogging.debug("     InputParameters for getLicenseConfigurationProcedure:", inputParameters);
 //    getLicenseConfigurationProcedure.setParameters(inputParameters);
 //    var dataSet = getLicenseConfigurationProcedure.queryProcedure();
	ELPLogging.debug("*** Finished getLicenseConfigurationRecords() ***");
	// loop through all license configuration records
	var licenseConfiguration = null;
	var configurations = {};
	while ((licenseConfiguration = dataSet.next()) != null) {
		if (configurations[licenseConfiguration.applicationType] != null) {	
			var lc = configurations[licenseConfiguration.applicationType];
			lc[licenseConfiguration.applicationSubType] = licenseConfiguration;	
			if (licenseConfiguration.lastSequenceNbr != null && licenseConfiguration.maskPattern != null) {
				ELPLogging.debug("CONFIG - Has applicationType", licenseConfiguration);
				lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
				lc.maskPattern = licenseConfiguration.maskPattern;
			}
		} else {
			configurations[licenseConfiguration.applicationType] = {};
			var lc = configurations[licenseConfiguration.applicationType];
			lc[licenseConfiguration.applicationSubType] = licenseConfiguration;
			if (licenseConfiguration.lastSequenceNbr != null && licenseConfiguration.maskPattern != null) {
				ELPLogging.debug("CONFIG - No applicationType", licenseConfiguration);				
				lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
				lc.maskPattern = licenseConfiguration.maskPattern;
			}			
		}
	} 
	}  finally {
		if (dataSet != null) {
			dataSet.close();
		}
		if (getLicenseConfigurationProcedure != null) {
			getLicenseConfigurationProcedure.close();
		}
		if (createConnection && (this.dbConnection != null)) {
			this.dbConnection.close();
		}
	}
	return configurations;	
}

/**
 * This function is a copy of the calculateDPLExpirationDate in INCLUDES_CUSTOM
 * Instead of updating the License, the calculated value is returned.
 * @param capId - Cap Id of Application
 * @returns expDate - Expiration Date of prospective License
 */
LicenseData.prototype.calculateDPLExpirationDate = function(capId, issueDateObj) {

	//Variables
	var bDateObj;
	var expDate = new Date();
	if (issueDateObj == null) {
		issueDateObj = expDate;
	}

	//Check for Record Type
	var applicationType = this.getApplicationType(capId);
	ELPLogging.debug("Record Type: " + applicationType.type + "/" + applicationType.subType);
	
	var applicationTypeandSubType = applicationType.type +" " + applicationType.subType;
	
	if (applicationType.type == "Sheet Metal" && applicationType.subType == "Apprentice")
	{
		applicationTypeandSubType = "Sheet Metal Master";
	}
	//else if (applicationType.type == "Sheet Metal" && applicationType.subType == "
	
	var licenseData = this.retrieveLicenseData(applicationTypeandSubType , applicationType.subType);
	var expirationCode = String(licenseData.expirationCode);
	ELPLogging.debug("expirationCode : - " + expirationCode);
		switch (expirationCode) {
		case LICENSE_EXPIRATION_CODES.FEB28_1YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.FEB28_1YR);			
			if(issueDateObj != null) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);
		      
				if (!this.withinExpirationBoundary(issueDateObj, licenseData)) {
					expDate.setDate(1);
					expDate.setFullYear((issueDateYear+1));
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);  
				} else {
					expDate.setDate(1);
					expDate.setFullYear(issueDateYear);
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);
				}
	
		    }			
			break;
		case LICENSE_EXPIRATION_CODES.BIRTH28_2YR:
			var bDateObj = this.getApplicantBirthDate(capId);
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.BIRTH28_2YR);
			if((issueDateObj != null) && (bDateObj != null)) {
				var issueDateYear = issueDateObj.getFullYear();
				if(bDateObj.getMonth() > issueDateObj.getMonth()) {
					expDate.setDate(1);
					expDate.setFullYear((issueDateYear-1));
					expDate.setMonth(bDateObj.getMonth());
					expDate.setDate(licenseData.expirationDay);
				} else {
					expDate.setDate(1);
					expDate.setFullYear(issueDateYear);
					expDate.setMonth(bDateObj.getMonth());
					expDate.setDate(licenseData.expirationDay);
				}

			}			
			break;
		case LICENSE_EXPIRATION_CODES.DEC31_1YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.DEC31_1YR);			
		    if(issueDateObj) {
		      var issueMonth = issueDateObj.getMonth();
		      var issueDate = issueDateObj.getDate();
		      var issueDateYear = issueDateObj.getFullYear();
		      //ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);
		      
		      if (!this.withinExpirationBoundary(issueDateObj, licenseData)) {
				expDate.setDate(1);
		        expDate.setFullYear((issueDateYear+1));
		        expDate.setMonth(licenseData.expirationMonth - 1);
		        expDate.setDate(licenseData.expirationDay);  
		      } else {
				expDate.setDate(1);
		        expDate.setFullYear(issueDateYear);
		        expDate.setMonth(licenseData.expirationMonth - 1);
		        expDate.setDate(licenseData.expirationDay);
		      }

		    }			
			break;
		case LICENSE_EXPIRATION_CODES.JULY31_3YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.JULY31_3YR);
			if(issueDateObj == null)
			{
				issueDateObj = new Date();
			}
			if(issueDateObj) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
		  
				var year = this.within90daysBoundaryCalculation(issueDateObj, licenseData);
				expDate.setDate(1);
				expDate.setFullYear(year);
				expDate.setMonth(licenseData.expirationMonth - 1);
				expDate.setDate(licenseData.expirationDay);
			}
			break;
		case LICENSE_EXPIRATION_CODES.ISSUE_2YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.ISSUE_2YR);			
			if(issueDateObj) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);
				expDate = issueDateObj;

		    }						
			break;
			case LICENSE_EXPIRATION_CODES.MAY01_EVENYR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.MAY01_EVENYR);			
			if(issueDateObj) {
				var issueMonth = issueDateObj.getMonth() + 1;
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				ELPLogging.debug("issueDateObj -- " + issueMonth+"/"+ issueDate+"/"+issueDateYear);
				ELPLogging.debug("licenseData -- " + licenseData);
                ELPLogging.debug("withinExpirationBoundary -- " + this.withinExpirationBoundary(issueDateObj, licenseData));
				if (this.withinExpirationBoundary(issueDateObj, licenseData)) {
					expDate.setDate(1);
					if (issueDateObj.getFullYear()%2 == 0)
					{
						expDate.setFullYear((issueDateYear-2));
					}
					else
					{
						expDate.setFullYear((issueDateYear-1));
					}
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);  
				} else {
					expDate.setDate(1);
					if (issueDateObj.getFullYear()%2 == 0)
					{
						expDate.setFullYear(issueDateYear);
					}
					else
					{
						expDate.setFullYear(issueDateYear - 1);
					}
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);
				}
				
				ELPLogging.debug("expDate : -- " + expDate);
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);
				//expDate = issueDateObj;

		    }						
			break;
			
		default:
			ELPLogging.debug("DEFAULT " + licenseData.expirationCode);
			break;
		}
		
		ELPLogging.debug("Expiration date to pass: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());		
        if(licenseData.expirationUnits == null) {
    		var returnException = new ELPAccelaEMSEException("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode(), ScriptReturnCodes.EMSE_PROCEDURE);
    		ELPLogging.debug(returnException.toString());
    		throw returnException;
        }

        if(licenseData.expirationUnits == "Days") {
        	expDate.setDate(expDate.getDate + licenseData.expirationInterval);
        }

        if(licenseData.expirationUnits == "Months") {
        	var day = expDate.getDate();
        	expDate.setMonth(expDate.getMonth() + pMonths);
        	if (expDate.getDate() < day)
        		{
        		expDate.setDate(1);
        		expDate.setDate(expDate.getDate() - 1);
        		}
        }

        if(licenseData.expirationUnits == "Years") {
        	var day = expDate.getDate();
        	expDate.setMonth(expDate.getMonth() + (licenseData.expirationInterval * 12));
        	if (expDate.getDate() < day)
        		{
        		expDate.setDate(1);
        		expDate.setDate(expDate.getDate() - 1);
        		}        	
        }
		ELPLogging.debug("Expiration date calculated: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());				
		return expDate;
}

/**
 * 
 * @param capId - CAP ID to search for Applicant
 * @returns bDateObj - birth date as JS Date
 */
LicenseData.prototype.getApplicantBirthDate = function(capId) {
	var bDateObj = null;
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if(capContactResult.getSuccess()) {
		capContactResult = capContactResult.getOutput();
		for(i in capContactResult) {
			var peopleModel = capContactResult[i].getPeople();
			var contactType = String(peopleModel.getContactType());
			if(contactType == "Applicant" ) {
				var capContactScriptModel = capContactResult[i];
				var capContactModel = capContactScriptModel.getCapContactModel();
				var bDate = capContactModel.getBirthDate();
				if(bDate != null) {
					bDateObj = new Date(bDate.getTime());
					ELPLogging.debug("Birth date:" + (bDateObj.getMonth() + 1) + "/" + bDateObj.getDate() + "/" + bDateObj.getFullYear());
				}   
			}
		}	
	}
	return bDateObj;
}


LicenseData.prototype.within90daysBoundaryCalculation = function(issueDateObj, licenseData) {
	var issueMonth = issueDateObj.getMonth();
	var issueDate = issueDateObj.getDate();
	var issueDateYear = issueDateObj.getFullYear();	
	// for expiration cycle year
	if((issueMonth >= 4 && issueMonth <= licenseData.expirationMonth) && issueDateYear%3 == 0) {
		return issueDateYear;
	}
	else if (issueDateYear%3 == 0 && issueMonth < 4) { // for 3 year 
		return issueDateYear - 3;
	}// for
	else if (issueDateYear%3 == 0 && issueMonth > licenseData.expirationMonth) {
		return issueDateYear;
	}
	else {
		return issueDateYear - (issueDateYear%3);
	}
}

/**
 * The License Pattern is SEQ-BOARD-TYPECLASS (no leading zeros on SEQ)
 * @param queryResult - Configuration for a Application Type and SubType
 * @returns customID - Alt ID for the CAP
 * 
 */
LicenseData.prototype.formatLicense = function(queryResult) {
	var boardCode = queryResult.BOARD_CODE;
	if(boardCode != 'SM')
	{
		boardCode = getBoardCode(queryResult); 
	}
	
	var typeClass = queryResult.TYPE_CLASS;
	var licenseNumber = Number(queryResult.LICENSE_NUMBER);
	var licenseNumberS = licenseNumber.toString();
	var customID = licenseNumberS + "-" + boardCode + "-" + typeClass;
	return customID;
}

function getBoardCode(queryResult) {
	ELPLogging.debug("Retrieve the board Code from application Number.");
	var applicationNumber = queryResult.APPLICATION_NUMBER;
	/* applicationNumber = applicationNumber.split("-"); */
	applicationModel = aa.cap.getCapID(applicationNumber).getOutput();
	var capModel = aa.cap.getCap(applicationModel).getOutput();
	var licenseBoard = capModel.getCapType().getSubType();
	ELPLogging.debug("licenseBoard : " + licenseBoard);
	var boardCode;
	
	switch(String(licenseBoard)) {
		case "Gas Fitter Master" :
		case "Gas Fitter Journeyman" :
			boardCode = "GF";
			break;
		
		case "Master" : 
		case "Journeyman" : 
			boardCode = "PL";
			break;
		
		case "Fire Alarm Systems Technician" : 
		case "Fire Alarm Systems Contractor" : 
			boardCode = "FA";
			break;
		
		case "Journeyman Electrician" : 
		case "Master Electrician" : 
			boardCode = "EL";
			break;
			
		default : 
			boardCode = "N/A";
		
	}
	return boardCode;
}

/**
 * This function retrieves the License Configurations from the configuratoins field by
 * Type and SubType
 * @param applicationType - Application Type
 * @param applicationSubType = Application SubType
 * @returns licenseConfiguration - License Configuration
 */
LicenseData.prototype.retrieveLicenseData = function(applicationType, applicationSubType) {
	var licenseData = null;
	if (this.configurations != null) {
		licenseData = this.configurations[applicationType];
		if (licenseData != null) {
			licenseData = licenseData[applicationSubType];
		}
	}
	return licenseData;	
}

/**
 * Retrieves the Application Types (group, type, subType, category) for the capId
 * @param capId - CAP ID for a Record
 * @returns applicationTypes - An Object consisting of
 * 		group - B1_PER_GROUP
 * 		type - B1_PER_TYPE
 * 		subType - B1_PER_SUBTYPE
 * 		category - B1_PER_CATEGORY
 */

LicenseData.prototype.getApplicationType = function(capId) {
	//Check for Record Type
	var applicationTypes = null;
	var capModelResult = aa.cap.getCap(capId);
	if (capModelResult.getSuccess()) {
		var vCapModel = capModelResult.getOutput();		
		var vType = vCapModel.capType;
		vType = vType.toString();
		var ids = new Array();
		ids = vType.split("/");
		applicationTypes = {};
		applicationTypes.group = ids[0];
		applicationTypes.type = ids[1];
		applicationTypes.subType = ids[2];
		applicationTypes.category = ids[3];
		this.capTypeAlias = ids[1] + " " + ids[2];
		appTypeArray = ids;
	}
	return applicationTypes;
}

/**
 * This function returns the Month (number) that determines whether the License period
 * begins on the previous year or the current year (based on the expiration month)
 * @param expirationMonth - Month this license type expires
 * @returns boundaryMonth - Month that determines which Year to start calculation of next
 * expiration date
 */
LicenseData.prototype.getExpirationMonthBoundary = function(expirationMonth) {
	if ((expirationMonth - 5) < 0) {
		return (12 + expirationMonth - 5);		
	} else {
		return (expirationMonth - 5);
	}
}

/**
 * This function returns the User ID that created the capId Record (Application)
 * @param capId - CAP ID of record
 * @returns appCreatedBy - User ID
 */
LicenseData.prototype.getCreatedBy = function(capId) {
	var capModelResult = aa.cap.getCap(capId);
	var appCreatedBy = null;
	if (capModelResult.getSuccess()) {
		var vCapModel = capModelResult.getOutput();			
		appCreatedBy = vCapModel.getCapModel().getCreatedBy();
	}
	return appCreatedBy;
}

/**
 * This function returns whether tye Issue Date falls beofre the Expiration Boundary,
 * (true) or after (false)
 * If it does fall before the start date for the License Expiration Date is the prior year
 * rather than the current year.
 * @param issueDateObj - Issue Date as JS Date
 * @param licenseData - License Configuration information
 * @returns  boolean
 * 
 */
LicenseData.prototype.withinExpirationBoundary = function(issueDateObj, licenseData) {
	var issueMonth = issueDateObj.getMonth()+1;
	var issueDate = issueDateObj.getDate();
	var issueDateYear = issueDateObj.getFullYear();	
	if ((licenseData.expirationMonth - 5) < 0) {
		var monthBoundary = (12 + licenseData.expirationMonth - 5);	
		if (issueMonth == monthBoundary && (issueDate >= licenseData.expirationDay)) {
			return true;
		} else if (issueMonth > monthBoundary ||
				issueMonth < licenseData.expirationMonth) {
			return true;
		} else {
			return false;
		}	
	} else {
		var monthBoundary = (licenseData.expirationMonth - 5);
		if (issueMonth == monthBoundary && (issueDate >= licenseData.expirationDay)) {
			return true;			
		} else if (issueMonth > monthBoundary &&
				issueMonth < licenseData.expirationMonth) {
			return true;
		} else {
			return false;
		}		
	}	
}


/**
 * This function Sets the License Expiration Date
 * @param capId - CAP ID of license
 * @param expDate - Expiration Date as JS Date
 * @returns boolean - true if Expiration Date is set
 * 
 */
LicenseData.prototype.setLicExpirationDate = function(capId, expDate) {
	// format date as MM/dd/yyyy
	var expDateS = dateFormattedIntC(expDate, "MM/dd/yyyy")
    var licNum = capId.getCustomID();
    var thisLic = new licenseObject(licNum,capId); 
    ELPLogging.debug("EXPIRATION " + expDateS);
    ELPLogging.debug("EXPIRATION " +  aa.date.parseDate(expDateS))
    thisLic.setExpiration(expDateS);
    ELPLogging.debug("EXPIRATION", thisLic.b1Exp);
    ELPLogging.debug("EXPIRATION " + thisLic.b1Exp.getB1Expiration());
  
    thisLic.setStatus("Active"); 
    ELPLogging.debug("Successfully set the expiration date and status");

    return true;

}

/**
 * This function issues a new license for a PSI Intake Application (Exam)
 * Besides creating the License, it updates the Task Status of the Application to
 * Ready for Printing, and adds the License Id to the Print Set.
 * @param capId - CAP ID of application
 * @param queryResult - PSI information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.issueLicense = function(capId, queryResult) {

	updateAppStatus("Ready for Printing", "Updated via Script", capId);
	deactivateWFTask("Intake", capId);
	deactivateWFTask("Exam", capId);
	activateWFTask("Issuance", capId);
	updateTaskStatus("Issuance", "Printed", "","","", capId);

	var newLicId = this.createLicense(capId, queryResult);
	ELPLogging.debug("New License Object :" + newLicId);
	ELPLogging.debug("Custom ID :" + newLicId.getCustomID());
	var srcCapId = capId;

	if (newLicId != null) {
		var fvShortNotes = getShortNotes(capId);
		updateShortNotes(fvShortNotes,newLicId);
		setContactsSyncFlag("N", newLicId);


		//if (appMatch("License/Sheet Metal/*/License", newLicId)) {
			//reportName = "SM|LICENSE_REGISTRATION_CARD";
		//}
		
		reportName = queryResult.BOARD_CODE+"|LICENSE_REGISTRATION_CARD";
		
		var appCreatedBy = this.getCreatedBy(capId);
		if (appCreatedBy != null) {
			editCreatedBy(appCreatedBy, newLicId);			
		}
		
		// Defect 8200
		if (queryResult.BOARD_CODE == "SM")
		{
		callReport(reportName, false, true, "DPL License Print Set", capId);
		}
	}
	return newLicId;
}


/**
 * This function creates the License and returns the new License Id (CAP ID)
 * @param capId - CAP ID of Application
 * @param queryResult - PSI information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.createLicense = function(lcapId, queryResult) {
	var licHolderType = "Licensed Individual";
	var contactType = "Applicant";
	var initStatus = "Current";
	ELPLogging.debug("contactType :" + contactType);
	ELPLogging.debug("licHolderType :" + licHolderType);

    var newLic = null;
    var newLicId = null;
    var newLicIdString = null;
    var boardCode = queryResult.BOARD_CODE;
    var oldAltID = null;
    var AltIDChanged = false;

    var types = this.getApplicationType(lcapId);

    //create the license record
    //unfortunately requires global capId
    capId = lcapId;

    newLicId = createParent(types.group, types.type, types.subType, "License", null);
    ELPLogging.debug("New License Id", newLicId);
    // Remove the ASI and Template tables from all contacts.
    removeContactTemplateFromContact(newLicId);
	if(queryResult.ISSUE_DATE!=null)
	{
		editLicIssueDate(newLicId);
	}
	
	var sysDate = new Date();
	var sysDateMMDDYYYY = dateFormattedIntC(sysDate,"");	
    ELPLogging.debug("sysDateMMDDYYYY " + sysDateMMDDYYYY);
    var rDate = new Date(sysDateMMDDYYYY);
    ELPLogging.debug("sysDateMMDDYYYY ", rDate);
    ELPLogging.debug("sysDateMMDDYYYY " + rDate.getTime());

    editFirstIssuedDate(sysDateMMDDYYYY, newLicId);
    oldAltID = newLicId.getCustomID();

    var asiTypeClass = queryResult.TYPE_CLASS;
    var licenseNo = queryResult.LICENSE_NUMBER;
    ELPLogging.debug("Board Code : " + boardCode);
    ELPLogging.debug("Type Class : " + asiTypeClass);
    ELPLogging.debug("License No : " + licenseNo);

    //change license Alt ID

	ELPLogging.debug("asiTypeClass : " + asiTypeClass);
	
	
	if(queryResult.BOARD_CODE=='SM')
	{
		var newAltID = this.formatLicense(queryResult);
	}
	else
	{
		var scanner = new Scanner(oldAltID.toString(),"-");
		var licenseNumber = scanner.next();
		var newAltID = (Number(queryResult.LICENSE_NUMBER)).toString()+ "-"+scanner.next()+"-"+scanner.next();
	}
	ELPLogging.debug("new Alt ID: " + newAltID);
	var updateCapAltIDResult = aa.cap.updateCapAltID(newLicId, newAltID);
	if (updateCapAltIDResult.getSuccess())
		ELPLogging.debug(newLicId + " AltID changed from " + oldAltID + " to " + newAltID);
	else
		ELPLogging.debug("**WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
	// verify new Alt Id
	capIdResult = aa.cap.getCapID(newAltID);
	if (!capIdResult.getSuccess()) {
		var returnException = new ELPAccelaEMSEException("Cannot find CapID for " + newAltID + ": " + capIdResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.debug(returnException.toString());
		throw returnException;
	}
	var returnedLicId = capIdResult.getOutput();
	if (!newLicId.equals(returnedLicId)) {
		var returnException = new ELPAccelaEMSEException("Cap IDs for " + newAltID + " do not match: " + newLicId + " and " + returnedLicId, ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.debug(returnException.toString());
		throw returnException;
	} else {
		newLicId = returnedLicId;
	}
	editAppSpecific("Type Class", asiTypeClass, newLicId);
	editAppSpecific("Continuing Education Waiver", "Temporary", newLicId);
	AltIDChanged = true;
    var newCapResult = aa.cap.getCap(newLicId);
    if (!newCapResult.getSuccess()) {
		var returnException = new ELPAccelaEMSEException("Cannot find Cap for " + newLicId + ": " + capIdResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.debug(returnException.toString());
		throw returnException;
    }
    newCap = newCapResult.getOutput();
    ELPLogging.debug("AltID:" + newCap.capModel.altID);

    updateAppStatus(initStatus, "", newLicId);
    newLicIdString = newLicId.getCustomID();

    if (AltIDChanged) {
        var newAltIDArray = newAltID.split("-");
        newLicIdString = newAltIDArray[0];
    }

    ELPLogging.debug("newLicIdString:" + newLicIdString);
	addToLicenseSyncSet(newLicId);	
	this.setLicExpirationDate(newLicId, queryResult.LIC_EXP_DATE);

	var vExpDate = convertDateToScriptDateTime(queryResult.LIC_EXP_DATE);

	ELPLogging.debug("Creating Ref LP.");
	
	var licNumberArray = newAltID.split("-");
	var licenseNumber = licNumberArray[0];
	var boardName = licNumberArray[1];
	var licenseType = licNumberArray[2];
	
	createRefLicProf(licenseNumber, boardName, licenseType, contactType, initStatus, vExpDate);
	//this.createRefLicProf(newAltID, contactType, initStatus, vExpDate, newLicId);

	newLic = getRefLicenseProf(licenseNumber, boardName, licenseType);

	if (newLic) {
		ELPLogging.debug("Reference LP successfully created");
		associateLpWithCap(newLic, newLicId);
	} else {
		ELPLogging.debug("Reference LP not created");
	}
    
     /* JIRA 2356 - Start: updated license issue and expiration date on b3contra table */
    licExpirationDate = vExpDate;
    licenseProfessional = getLicenseProfessional(newLicId);
    
    if(queryResult.ISSUE_DATE!=null)
	{
		sysDate = queryResult.ISSUE_DATE;
	}
	var vIssueDate = convertDateToScriptDateTime(sysDate);
    if (licenseProfessional)
    {
        for (var thisCapLpNum in licenseProfessional) 
        {
            var licProf = licenseProfessional[thisCapLpNum];
            
            var licNbrB3contra = licProf.getLicenseNbr();
            var boardCodeB3contra = licProf.getComment();
            var typeClassB3Contra = licProf.getBusinessLicense(); 

            if((licenseNumber == licNbrB3contra) && (boardName == boardCodeB3contra) && (licenseType == typeClassB3Contra))
            {
                licProf.setLicenseExpirDate(licExpirationDate);
                licProf.setLicesnseOrigIssueDate(vIssueDate);
                aa.licenseProfessional.editLicensedProfessional(licProf);
            }
        }
    }

	conToChange = null;
	cons = aa.people.getCapContactByCapID(newLicId).getOutput();
	ELPLogging.debug("Contacts:" + cons);
	ELPLogging.debug("Contact Length:" + cons.length);

	for (thisCon in cons) {
		if (cons[thisCon].getCapContactModel().getPeople().getContactType() == contactType) {
			conToChange = cons[thisCon].getCapContactModel();
			
			refContactSeqNumber = conToChange.getRefContactNumber();
			p = conToChange.getPeople();
			p.setContactType(licHolderType);
			conToChange.setPeople(p);
			aa.people.editCapContact(conToChange);
			ELPLogging.debug("Contact type successfully switched to " + licHolderType);

			//added by thp to copy contact-Addres
			var source = getPeople(lcapId);
			//source = aa.people.getCapContactByCapID(capId).getOutput();
			for (zz in source) {
				sourcePeopleModel = source[zz].getCapContactModel();
				if (sourcePeopleModel.getPeople().getContactType() == contactType) {
					p.setContactAddressList(sourcePeopleModel.getPeople().getContactAddressList());
					aa.people.editCapContactWithAttribute(conToChange);
					ELPLogging.debug("ContactAddress Updated Successfully");
				}
			}
		}
    }

    return newLicId;
}

/**
 * This function validates the PSI data, to insure the data is consistent with the information
 * in Accela before processing the Exam results and License issuance. Currently the License Number
 * and the Expiration Date are validated.
 * @param capId - CAP ID of Application
 * @param queryResult - PSI data
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validatePSIData = function(capId, queryResult) {
	//ELPLogging.debug("PARAMETERS", queryResult);
	var issueDateObj = queryResult.ISSUE_DATE;
	var inputExpDate = queryResult.LIC_EXP_DATE;
	var expDate = this.calculateDPLExpirationDate(capId, issueDateObj);
	// do not validate input expiration date for SM, (defect 8151)

	var types = this.getApplicationType(capId);
	
	var lastSequenceNbr = this.configurations[this.capTypeAlias].lastSequenceNbr;
	//lastSequenceNbr++;
	ELPLogging.debug("Next SequenceNbr " + lastSequenceNbr);
	
	var validationFlagArray = {};
	
	var inputLicNo = Number(queryResult.LICENSE_NUMBER);
	if (queryResult.BOARD_CODE == "SM") {
		ELPLogging.debug("SKIP validation for SM board " );		
		inputExpDate = expDate;
		queryResult.LIC_EXP_DATE = expDate;	// this field is used to set expiration date	
		validationFlagArray.licenseExpirationFlag = true;
		validationFlagArray.licenseNumberFlag = true;	
	} else if (queryResult.BOARD_CODE == "PL") {
        ELPLogging.debug("SKIP validation for PL board " );     
        // inputExpDate = expDate;
        queryResult.LIC_EXP_DATE = inputExpDate; // this field is used to set expiration date    
        validationFlagArray.licenseExpirationFlag = true;
        validationFlagArray.licenseNumberFlag = true;
    } else {
	validationFlagArray.licenseExpirationFlag = this.validateExpirationDate(inputExpDate, expDate);
	validationFlagArray.licenseNumberFlag = this.validateLicenseNumber(inputLicNo, lastSequenceNbr);
	}
	
	return validationFlagArray;
}

/**
 * This function validates the expiration date
 * @param inputExpDate - Expiration Date from PSI
 * @param expDate - Expiration Date calculated in Accela
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validateExpirationDate = function(inputExpDate, expDate) {
	if (expDate == null) {
		return false;
	}
	var inputExpDateS = dateFormattedIntC(inputExpDate, "MMDDYYYY");
	var expDateS = dateFormattedIntC(expDate, "MMDDYYYY");
	ELPLogging.debug("PSI Expiration Date:        " + inputExpDateS);
	ELPLogging.debug("Calculated Expiration Date: " + expDateS);
	if (inputExpDateS == expDateS) {
		return true;
	} else {
		return false;
	}
	
}

/**
 * This function validates the License Number
 * @param inputLicNo - License Number from PSI
 * @param licNo - next License Number in Accela (LICENSE_SEQUENCE_NUMBER standard choice)
 * @returns boolean - true if number is valie, false if number is not valid
 */
/*LicenseData.prototype.validateLicenseNumber = function(inputLicNo, lastSequenceNbr) {
	if (inputLicNo == lastSequenceNbr) {
		return true;
	} else {
		return false;
	}
}*/

LicenseData.prototype.validateLicenseNumber = function(inputLicNo, lastSequenceNbr)
{
	var validationResult = false;
	var loopBreaker = true;
	
	while(loopBreaker)
	{
		if (inputLicNo == lastSequenceNbr)
		{
			validationResult = true;
			loopBreaker = false;
			lastSequenceNbr = this.configurations[this.capTypeAlias].lastSequenceNbr++;
		}
		// Insert an error in Error table if Intake file License number is less than the License Sequence number in standard choice.
		else if (inputLicNo < lastSequenceNbr)
		{
			var errorMessage = queryResult.BOARD_CODE + ":License Number is less than the expected license number";
			// Inserting error in Error table.
			var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : queryResult.APPLICATION_NUMBER,"ErrorDescription" : errorMessage,"runDate" : new Date(batchAppResultObj.runDate)};
								  
			callToStoredProcedure(emseInsertParameters, "errorTable");
			
			ELPLogging.debug("License sequence number " + queryResult.LICENSE_NUMBER + " in intake file is less then the next license sequence number " + this.configurations[this.capTypeAlias].lastSequenceNbr + " Error -- " + errorMessage);
			
			validationResult =  false;
			loopBreaker = false;
		}
		// Insert an error in Error table if Intake file License number is greater than the License Sequence number in standard choice.
		// Also increment the standard choice license sequence number.
		else
		{
			var errorMessage = queryResult.BOARD_CODE + ":Expected license sequence number was " + this.configurations[this.capTypeAlias].lastSequenceNbr;
			// Inserting error in Error table.
			var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : queryResult.APPLICATION_NUMBER,"ErrorDescription" : errorMessage,"runDate" : new Date(batchAppResultObj.runDate)};
								  
			callToStoredProcedure(emseInsertParameters, "errorTable");
			
			ELPLogging.debug("License sequence number " + queryResult.LICENSE_NUMBER + " in intake file is greater then the next license sequence number " + this.configurations[this.capTypeAlias].lastSequenceNbr + " Error -- " + errorMessage);
			
			lastSequenceNbr = ++this.configurations[this.capTypeAlias].lastSequenceNbr;
		}
	}
	
	return validationResult;
}

/**
 * This function validates the license masking pattern to ensure that the masking pattern is correct.
 * @param queryResult - PSI data
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validateLicenseFormat = function(queryResult, applicationRecordID) {
	ELPLogging.debug("Validating license format.");
	
	var maskingPattern = this.configurations[this.capTypeAlias].maskPattern; //maskPattern
	var mask = maskingPattern.split("-");
	var masking = mask[1] + "-" + mask[2];
	ELPLogging.debug("Existing masking : " +masking);
	
	var ELArray = ["EL", "FA"];
	var PLArray = ["PL", "GF"];
	var SMArray = ["SM"];

	var boardCode = queryResult.BOARD_CODE;
	// Based on the board value obtained from application record, validate the input board and type values
	if (exists(boardCode, ELArray))
	{
		ELArray[0] = ELArray[0] +"-" + queryResult.TYPE_CLASS;
		ELArray[1] = ELArray[1] +"-" + queryResult.TYPE_CLASS;
		ELPLogging.debug("EL Array : " + ELArray);
		if (exists(masking, ELArray))
		{
			return true;
		}
		else 
		{
			ELPLogging.debug("Invalid Masking pattern.");
			return false;
		}
	}
	else if (exists(boardCode, PLArray))		       
	{
		PLArray[0] = PLArray[0] +"-" + queryResult.TYPE_CLASS;
		PLArray[1] = PLArray[1] +"-" + queryResult.TYPE_CLASS;
		ELPLogging.debug("PL Array : " + PLArray);
		if (exists(masking, PLArray))
		{
			return true;
		}
		else 
		{
			ELPLogging.debug("Invalid Masking pattern.");
			return false;
		}
	}
	else if(exists(boardCode, SMArray))
	{
		return true;
	}
	else
	{
		ELPLogging.debug("Invalid Board code.");
		return false;
	}
}

/**
 * This function converts a JS Date to a Accela ScriptDateTime
 * @param jsDate - JS Date
 * @returns accelaDate - ScriptDateTime
 */
function convertDateToScriptDateTime(jsDate) {
	var utilDate = convertDateToJavaDate(jsDate);
	var accelaDate = aa.date.getScriptDateTime(utilDate);		
	return accelaDate;
}

/**
 * This function converts a JS Date to a Java Util Date
 * @param jsDate - JS Date
 * @returns utilDate - Java Util Date
 */
function convertDateToJavaDate(jsDate) {
	var utilDate = new java.util.Date(jsDate.getTime());
	return utilDate;

}

/**
 * This function increments the Last Sequence Number for a Application Type
 * (this occurs after processing an incoming License issuance)
 * @param applicationType - Application Type (Sheet Metal)
 * @returns void
 */
LicenseData.prototype.incrementLastSequenceNbr = function(applicationType) {
	var lc = this.configurations[applicationType];
	if (lc != null && lc.lastSequenceNbr != null) {
		return lc.lastSequenceNbr;
	}
}

/**
 * This function updates the LICENSE_SEQUENCE_NUMBER standard choice with the values
 * in configurations
 * @param void
 * @returns void
 */
LicenseData.prototype.updateLicenseSequenceNumbers = function() {
	var lcs = this.configurations;
	for (var type in lcs) {
		var lc = lcs[type];
		var stdDesc = lc.lastSequenceNbr.toString();
		updateStandardChoice("LICENSE_SEQUENCE_NUMBER",type,stdDesc);
	}
}

function deactivateWFTask(wfstr, capId) 
{

	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	var wfnote = null;
	var wfcomment = "Closed by Script";
	for (i in wfObj) {
		var fTask = wfObj[i];
        ELPLogging.debug(fTask.getTaskDescription()  +"----"+ fTask.getProcessCode());
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))
        {
			var dispositionDate = aa.date.getCurrentDate();			
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();
			completeFlag = "Y";
			var wfstat = fTask.getDisposition();
			ELPLogging.debug("Complete Flag " + completeFlag);
			aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
			ELPLogging.debug("deactivating Workflow Task: " + wfstr);
		}
	}
}
function activateWFTask(wfstr,capId) 
{

	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
    var procId = wfObj[0].getProcessID();	
	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null);
            // Assign the user
            var taskUserObj = fTask.getTaskItem().getAssignedUser();
            //taskUserObj.setDeptOfUser("DPL/DPL/LIC/EDP/STAFF/NA/NA");

            //fTask.setAssignedUser(taskUserObj);
            var taskItem = fTask.getTaskItem();

            var adjustResult = aa.workflow.assignTask(taskItem);
            if (adjustResult.getSuccess()) {
            	ELPLogging.debug("Updated Workflow Task : " + wfstr);
            } else {
            	ELPLogging.debug("Error updating wfTask : " + adjustResult.getErrorMessage());
            }         
			
			ELPLogging.debug("Activating Workflow Task: " + wfstr.toUpperCase());
		}
	}
}

function closeTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
{
var useProcess = false;
var processName = "";
if (arguments.length == 5) 
	{
	processName = arguments[4]; // subprocess
	useProcess = true;
	}

var workflowResult = aa.workflow.getTaskItems(capId,wfstr,processName,null,null,null);
	if (workflowResult.getSuccess())
	 	var wfObj = workflowResult.getOutput();
	else
	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

if (!wfstat) wfstat = "NA";

for (i in wfObj)
	{
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
		{
		var dispositionDate = aa.date.getCurrentDate();
		var stepnumber = fTask.getStepNumber();
		var processID = fTask.getProcessID();

		if (useProcess)
			aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
		else
			aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
		
		logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat);
		logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat);
		}			
	}
}



/*
 * this is unit test cases for verifying this script
 */
if (intLicenseTesting) {
	ELPLogging.debug("start test");
	aa.print(ELPLogging.toString());
}

/**
 * This function increments the Last Sequence Number in standard choice.
 * (this occurs after processing an incoming License issuance)
 * @param stdChoice - Standard choice name
 * @param stdValue - Standard choice field name
 * @param stdDesc - incremented last sequence number
 * @returns boolean
 */
function updateStandardChoice(stdChoice,stdValue,stdDesc) 
{
	//check if stdChoice and stdValue already exist; if they do, update;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(String(stdChoice),String(stdValue));
	if (bizDomScriptResult.getSuccess())  {
		bds = bizDomScriptResult.getOutput();
	} else {
		ELPLogging.debug("Std Choice(" + stdChoice + "," + stdValue + ") does not exist to edit, adding...");
		return addStandardChoice(stdChoice,stdValue,stdDesc);
	}
	var bd = bds.getBizDomain()
	
	bd.setDescription(String(stdDesc));
	var editResult = aa.bizDomain.editBizDomain(bd)

	if (editResult.getSuccess()) {
		ELPLogging.debug("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
		return true;
	} else {
		ELPLogging.debug("**ERROR editing Std Choice " + editResult.getErrorMessage());
		return false;
	}
}

/**
 * This function validates the SSN number
 * @param socSecNumber - SSN number
 * @returns boolean : 
	1. ssnFlag : This flag shows that SSN number flag contains alpha numeric value or not.
	2. ssnExpressionLogic : This flag shows that expression logic validated or not.
 */
function validateSSN(socSecNumber) 
{
	ELPLogging.debug("Validating SSN : " +socSecNumber);
	var ssnValidation = {};
	 
	// SSN number should not contain the alpha characters.
	if (!isNaN(socSecNumber))
	{	
		// SSN number should follow the expression logic.
		if (socSecNumber.match(/^(?!\b(\d)\1+\b)(?!123456789|219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/))
		{
			ssnValidation.ssnExpressionLogic = false;
		}
		else
		{
			ELPLogging.debug("Invalid Expression logic for SSN Number.");
			ssnValidation.ssnExpressionLogic = true;
		}
		
		ssnValidation.ssnFlag = true;
	}
	else
	{	
		ELPLogging.debug("Invalid SSN.");
		ssnValidation.ssnFlag = false;
		ssnValidation.ssnExpressionLogic = false;
	}
	
	return ssnValidation;
}

/**
 * This function retrieve the reference contact if exist.
 * @param queryResult - Contains dataSet of Staging table.
 * @returns boolean
 */
function retrieveContactByPPLModel(queryResult)
{
	ELPLogging.debug("Retrieve cap contact by people model.");
	var contactPeopleModel;
	var peopleModel = new com.accela.aa.aamain.people.PeopleModel();
	peopleModel.setFirstName(queryResult.FNAME);
	peopleModel.setLastName(queryResult.LNAME);
	peopleModel.setServiceProviderCode("DPL");
	
	// Formate the SSN number as per the Accela standard i.e. 'XXX-XX-XXXX'
	var socSecNumber = queryResult.SSN;
	var ssn1 = socSecNumber.substr(0, 3);
	var ssn2 = socSecNumber.substr(3, 2);
	var ssn3 = socSecNumber.substr(5, 4);
	socSecNumber = ssn1+"-"+ssn2+"-"+ssn3;
	ELPLogging.debug("Formatted SSN number : " +socSecNumber);
	peopleModel.setSocialSecurityNumber(socSecNumber);

	// Load the reference contact via First, Last name and SSN number
	var peopleResult = aa.people.getPeopleByPeopleModel(peopleModel);

	if (peopleResult.getSuccess())
	{
		var peopleScriptModel = peopleResult.getOutput();
		
		if (peopleScriptModel.length == 0)
		{
			ELPLogging.debug("Searched for REF contact, no matches found, returning null");
		}
		if (peopleScriptModel.length > 0) 
		{
			ELPLogging.debug("Searched for a REF Contact, " + peopleScriptModel.length + " matches found! returning the first match : " + peopleScriptModel[0].getContactSeqNumber());
			
			var contactSeqNumber =  peopleScriptModel[0].getContactSeqNumber();
			
			contactPeopleModel = peopleScriptModel[0].getPeopleModel();
		}
		
	}
	else
	{
		ELPLogging.debug("WARNING: error searching for people : " + peopleResult.getErrorMessage());
	}
	
	return contactPeopleModel;
}

/**
 * This function add a new contact to application record.
 * @param capIDModel - Application ID.
 * @param latestPeopleModel - People Model to add contact to cap.
 * @returns boolean
 */
function addContactToCap(capIDModel, latestPeopleModel)
{
	var capContactModel = new com.accela.aa.aamain.people.CapContactModel(); 
	
	//Adding the people Model to Application record.
	var contactResult = aa.people.createCapContactWithRefPeopleModel(capIDModel, latestPeopleModel);
	
	if (contactResult.getSuccess())
	{
		ELPLogging.debug("Contact successfully added to CAP.");
		var capContactResult = aa.people.getCapContactByCapID(capIDModel);
		if (capContactResult.getSuccess()) 
		{
			var capContactResultModel = capContactResult.getOutput();
			var capContactLength = capContactResultModel.length;
			var newContactSeqNumber = capContactResultModel[capContactLength - 1].getCapContactModel().getPeople().getContactSeqNumber();
			ELPLogging.debug("Contact number = " + newContactSeqNumber);
			return newContactSeqNumber;
		} 
		else
		{
			ELPLogging.debug("**ERROR: Failed to get Contact number: " + capContactResult.getErrorMessage());
			return false;
		}
	} 
	else 
	{
		ELPLogging.debug("**ERROR: Cannot add contact: " + contactResult.getErrorMessage());
		return false;
	}
}


/** 
 * @desc The Method calculates the number of days between 2 dates.
 * @param statusDate : Date from which date calculation starts.
 * @return noDays : Number days between statusDate and Today's date.
 * @throws  N/A
 */ 
function checkWorkFlowTaskStatusUpdateInRange(statusDate, windowPeriod)
{
	var fallInWindowFlag = false;

	var formattedStatusDate = new Date(statusDate);
	var windowEndDate = formattedStatusDate.setYear(formattedStatusDate.getFullYear() + windowPeriod);
	var parsedStatusDate = Date.parse(formattedStatusDate);
	// Converting the date object to JavaScript date.	
	var jsStatusDate = new Date(parsedStatusDate);
	
	var todaysDate = new Date();
	var parsedTodaysDate = Date.parse(todaysDate);
	// Converting the date object to JavaScript date.
	var jsTodaysDate = new Date(parsedTodaysDate);
	
	ELPLogging.debug("Applicant can appear in the Exam till : " + jsStatusDate);

	// Workflow task/status end date should be greater then or equal to today's date.
	if (jsStatusDate >= jsTodaysDate)
	{
		fallInWindowFlag = true;
	}

	return fallInWindowFlag;
}

/** 
 * @desc The Method gives the contact sequence number for Application ID.
 * @param capID : Application ID.
 * @throws  N/A
 */ 
function getContactId(capIDModel)
{
	ELPLogging.debug("Retrieve contact id for record : " +capIDModel);
	
	//retrieve list of contacts for the CAP
    var capContactResult = aa.people.getCapContactByCapID(capIDModel);
    var capContactList = capContactResult.getOutput();
    
	if(capContactList)
	{
    	//loop through the list of contacts
        for(index in capContactList)
        {
	        var contactIdStr = capContactList[index].getPeople().getContactSeqNumber();
	        var contactId = aa.util.parseLong(contactIdStr);
	        ELPLogging.debug("contactId : " +contactId);
	        return contactId;            
        }
    }
    else
	{

    	ELPLogging.debug("Error retrieving the contact list for "+capIDModel+": "+capContactResult.getErrorMessage());
	}
}



/** 
 * @desc The Method create the set if not exist else return the existing one.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @return Set Name
 * @throws  N/A
 */ 
function getMonthlyPaymentSet(queryResult)
{
	var pJavaScriptDate = new Date();
	
	var month = pJavaScriptDate.getMonth()+1;
	var formattedMonth;
	
	if(month < 10)
		formattedMonth = "0"+month;
	else
		formattedMonth = month;
		
	var dateString = formattedMonth+"_"+pJavaScriptDate.getFullYear();;
		
	// Formate the set name.
	var setName = "DPL_PSI_EXAM_" + queryResult.BOARD_CODE + "_"+dateString;
	
	var setResult = aa.set.getSetByPK(setName);
	
	// Check the set's existence in Accela.
	if(setResult.getSuccess())
	{
		ELPLogging.debug("Monthly payment set: "+ setName+ " already exists.");
	}
	else
	{
		// Create a new set if it does not already exists.
		setResult = aa.set.createSet(setName,setName);
		if(setResult.getSuccess())
		{
			ELPLogging.debug("Successfully created the set: "+ setName);
		}
		else
		{
			ELPLogging.notify("Unable to create set "+setName+" : \n Error: "+ScriptReturnCodes.EMSE_PROCEDURE);
			throw new ELPAccelaEMSEException("Unable to create set ", ScriptReturnCodes.EMSE_PROCEDURE);
		}
	}
	
	return setName;
}

/** 
 * @desc The Method Add Application record to Monthly payment set.
 * @param setName : Monthly payment set.
 * @param capID : Application ID.
 * @return boolean
 * @throws  N/A
 */ 
function addApplicationRecordToMonthlyPaymentSet(setName, capID)
{
	var scanner = new Scanner(capID.toString(),"-");

	var id1 = scanner.next();
	var id2 = scanner.next();
	var id3 = scanner.next();

	var capIDModel = aa.cap.getCapID(id1,id2,id3).getOutput();
	var setFlag  = false;

	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();

	setDetailScriptModel.setSetID(setName);
	setDetailScriptModel.setID1(id1);
	setDetailScriptModel.setID2(id2);
	setDetailScriptModel.setID3(id3);
	
	var memberListResult = aa.set.getSetMembers(setDetailScriptModel);
	
	if(memberListResult.getSuccess())
	{
		var memberList = memberListResult.getOutput();
		
		//If the member list size is more than zero then record present in the set
		if(memberList.size())
		{
			ELPLogging.debug("Application record already exists in the set");
		}
		else
		{
			aa.set.add(setName,capIDModel);	
			ELPLogging.debug("Application record added to the set - " + setName);
		}
		
		setFlag = true;
	}
	
	return setFlag;
}

/** 
 * @desc The Method creates the contact record.
 * @param capIDModel : capIDModel.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws  N/A
 */ 
function createCapContact(capIDModel, queryResult, contactAddressObject)
 {
	ELPLogging.debug("Creating cap contact model for record ID : " +capIDModel);		
	
	var capContactModel = new com.accela.aa.aamain.people.CapContactModel(); 
	var peopleScriptModelResult = aa.people.createPeopleModel();
	var peopleScriptModel = peopleScriptModelResult.getOutput();
	
	if (peopleScriptModel)
	{
		//create PeopleModel and populate
        var peopleModel = peopleScriptModel.getPeopleModel();
        peopleModel.setContactType(contactAddressObject.contactType);		
        peopleModel.setFlag("Y");
        peopleModel.setFirstName(queryResult.FNAME);
        peopleModel.setLastName(queryResult.LNAME);
		peopleModel.setMiddleName(queryResult.MNAME);
		/* Fix for defect #5350 */
		var ssn = formatSSN(queryResult.SSN);
		peopleModel.setSocialSecurityNumber(ssn);
		peopleModel.setServiceProviderCode("DPL");
        peopleModel.setPhone1(queryResult.PRIMARY_PHONE);
        peopleModel.setPhone2(queryResult.MOBILE);
        peopleModel.setEmail(queryResult.EMAIL);
        peopleModel.setAuditStatus("A");
        peopleModel.setStartDate(new java.util.Date());
        peopleModel.setAuditID("BATCHUSER");
		peopleModel.setGender(queryResult.GENDER);
		peopleModel.setBirthDate(queryResult.DATE_BIRTH);
		peopleModel.setEmail(queryResult.EMAIL);
		
		if (queryResult.PREF_COMMUNICATION.toUpperCase() == "EMAIL")
		{
			// Setting the preferred communication mode to Email.
			peopleModel.setPreferredChannel(1);
		}
		else
		{
			// Setting the preferred communication mode to Mail.
			peopleModel.setPreferredChannel(0);
		}
        
        capContactModel.setPeople(peopleModel);
        
        capContactModel.setCapID(capIDModel);
		
		var createContactResult = aa.people.createCapContact(capContactModel).getOutput();
		
		// Call the method to get the contact sequence number.
		var contactId = getContactId(capIDModel);
		
		// Create an address entry on contact.
		createContactAddress(contactId, queryResult, capIDModel, contactAddressObject.addressType);		
		
		// Creating the Reference contact from transaction contact.
		var peopleModel = new com.accela.aa.aamain.people.PeopleModel();
		/* Fix for defect #5350 */
		var ssn = formatSSN(queryResult.SSN);
		peopleModel.setSocialSecurityNumber(ssn);
		var opUserExists = refContactExistsBySSN(peopleModel);
		ELPLogging.debug("opUserExists----" + opUserExists);
		//refContactNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel, "Applicant", null, true, opUserExists);
		refContactNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel,null,null,false,false, peopleDuplicateCheck)
		setContactsSyncFlag("N", capIDModel);
		
		// Adding Other Class, First, Middle and Last Name to AKA.
		if ((queryResult.OTHER_FNAME != null) || (queryResult.OTHER_MNAME != null) || (queryResult.OTHER_LNAME != null)
			|| (queryResult.OTHER_CLASS != null))
		{
			addAKAToRefContact(refContactNumber, queryResult.OTHER_FNAME, queryResult.OTHER_MNAME, queryResult.OTHER_LNAME,
						   queryResult.OTHER_CLASS, new Date(), null);
		}
	}
	else
	{
		ELPLogging.debug("Error creating a people model for "+capIDModel+": "+peopleScriptModelResult.getErrorMessage());
	}
}


/** 
 * @desc The Method creates the contact record.
 * @param contactId : Contact sequence number.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @param capID : cap ID Model.
 * @throws  N/A
 */ 
function createContactAddress(contactId, queryResult, capID, addressType) {
	ELPLogging.debug("Create contact address for contact sequence number : " +contactId);

    var zipCode = queryResult.ZIP_CODEA + queryResult.ZIP_CODEB;
    
	//Get the Contact Address model and set the address values. 
	var capContactAddressModel = new com.accela.orm.model.address.ContactAddressModel();
		
	/*capContactAddressModel.setHouseNumberAlphaStart(queryResult.BUILDING_NUM);
	capContactAddressModel.setAddressLine1(queryResult.STREET_NAME);
	capContactAddressModel.setAddressLine1(queryResult.ADDRS_2ND_LN);
    capContactAddressModel.setCity(queryResult.CITY_TOWN);
    capContactAddressModel.setState(queryResult.STATE);
    capContactAddressModel.setZip(zipCode);*/
	
	
	capContactAddressModel.setAddressLine1(contactAddressDetailsArray.addressLine1);
	capContactAddressModel.setAddressLine2(contactAddressDetailsArray.addressLine2);
    capContactAddressModel.setCity(contactAddressDetailsArray.city);
    capContactAddressModel.setState(contactAddressDetailsArray.state);
    capContactAddressModel.setZip(contactAddressDetailsArray.zipCodeA);
    capContactAddressModel.setPrimary("Y");
    capContactAddressModel.setCountryCode("US");
    capContactAddressModel.setEntityType("CONTACT");	
    capContactAddressModel.setAddressType(addressType);
    capContactAddressModel.setEntityID(contactId);
    
	// Create the cap Contact Address.
    aa.address.createCapContactAddress(capID , capContactAddressModel);
}

/** 
 * @desc This script validates if the phone number value is populated without any alpha characters.
 * @param {String} phoneNumber - contains the phone number in String format 
 * @returns {Boolean} validation flag
 * @throws  N/A
 */ 
function validatePhoneNumber(phoneNumber)
{
	ELPLogging.debug("Validating Phone Number");
	var validationResult = false;
	if(phoneNumber != null) {
		var scanner = new Scanner(phoneNumber,"-");
		var formattedPhNumber = scanner.next()+scanner.next()+scanner.next();
		ELPLogging.debug("Formatted Phone Number : " + formattedPhNumber);
		if(!isNaN(formattedPhNumber))
		{
			validationResult =  true;
			ELPLogging.debug("Phone Number validated");
		}	
		else
		{
			ELPLogging.debug("Invalid Phone Number");
		}
	}
	return validationResult;
}



/** 
 * @desc This Method add ASIT on Application Record
 * @param {capID} capID -  Application ID.
 * @param {cSeqNumber} cSeqNumber -  Transaction contact sequence number.
 * @param {rConAddrModel} rConAddrModel -  Reference people model.
 * @return boolean
 * @throws  N/A
 */
function associateRefContactAddressToTransactionContact(capID, cSeqNumber, rConAddrModel)
{
	// All passed in parameters are required fields and can not be null
	if (capID && cSeqNumber && rConAddrModel)
	{
		var xRefContactAddress = aa.address.createXRefContactAddressModel().getOutput();
		xRefContactAddress.setCapID(capID);
		xRefContactAddress.setAddressID(rConAddrModel.getAddressID());
		// Set the contact id to xRefContactAddress model
		xRefContactAddress.setEntityID(aa.util.parseLong(cSeqNumber));
		xRefContactAddress.setEntityType(rConAddrModel.getEntityType());
		
		// Associating reference contact address to transaction contact address.
		var xrefResult = aa.address.createXRefContactAddress(xRefContactAddress.getXRefContactAddressModel());
		if (xrefResult.getSuccess)
		{
			ELPLogging.debug("Successfully associated reference contact address to cap contact: " + cSeqNumber);
			return true;
		}
		else
		{
			ELPLogging.debug("Failed to associate reference contact address to cap: " + xrefResult.getErrorMessage());
			return false;
		}
	}
	else
	{
		ELPLogging.debug("Could not associate reference contact address no address model, capId or cap contact sequence number");
		return false;
	}
}

/**
 * @desc This method creates an AddressModel. This will become the Premise Address for the Complaint record.
 * @param {capIdModel} capIDModel - contains the record id from Accela system.
 * @param {queryResult} contains query result from staging table.
 * @throws  ELPAccelaEMSEException
 */
function createPremiseAddress(capIDModel, queryResult)
{
	ELPLogging.debug("Creating premise address for record ID : " +capIDModel);
        
	var addressModel = new com.accela.aa.aamain.address.AddressModel();
    
	addressModel.setHouseNumberAlphaStart(queryResult.B_BUILDING_NUMBER);
	addressModel.setAddressLine1(queryResult.B_STREET_NAME);
	addressModel.setAddressLine2(queryResult.B_ADDR_LN_2);
    addressModel.setCity(queryResult.B_CITY_TOWN);
    addressModel.setState(queryResult.B_STATE);
    addressModel.setZip(queryResult.B_ZIP_A);
    addressModel.setPrimaryFlag("Y");
    addressModel.setServiceProviderCode("DPL");
    addressModel.setAuditID("BATCHUSER");
    addressModel.setCapID(capIDModel);
	
	var premiseAddressResult = aa.address.createAddress(addressModel);
	
	if(!premiseAddressResult.getSuccess())
	{
	    var returnException = new ELPAccelaEMSEException("Error creating the Premise Address for record "+capIDModel+": "+premiseAddressResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
	    throw returnException;
	}
}

/**
 * @desc This Method assign task to board's user group.
 * @param {String} wfstr - workflow task name
 * @param {String} userName - Board's user ID
 * @param {String} capId - Record ID.
*/
function assignTaskToUser(wfstr, userName, capId)
{
	var useProcess = false;
	var processName = "";
	
	var taskUserResult = aa.person.getUser(userName);
	
	if (taskUserResult.getSuccess())
	{
		taskUserObj = taskUserResult.getOutput(); //  User Object
	}
	else
	{
		ELPLogging.debug("**ERROR: Failed to get user object: " + taskUserResult.getErrorMessage());
		return false;
	}
	
	// Load the task from Record ID.
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
	{
		var wfObj = workflowResult.getOutput();
	}
	else
	{
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	
	for (index in wfObj)
	{
		var fTask = wfObj[index];
		
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName)))
		{
			fTask.setAssignedUser(taskUserObj);
			var taskItem = fTask.getTaskItem();
			// Assigned the user to the task.
			var adjustResult = aa.workflow.assignTask(taskItem);
			ELPLogging.debug("Assigned Workflow Task: " + wfstr + " to " + userName);
		}
	}
}

LicenseData.prototype.checkLicenseNumber = function(queryResult) {
	var newAltID = this.formatLicense(queryResult);
	ELPLogging.debug("Check Alt ID: " + newAltID);
    var capListResult = aa.cap.getCapID(newAltID);           
    if (capListResult.getSuccess()) { 
        var capID = capListResult.getOutput();  
        ELPLogging.debug("License already exists", capID);
        return false;
    }
	else {
		ELPLogging.debug("License number is available " + newAltID);
		return true;
	}
}
/**
 * @desc This method will update license file Date and reported date
 * @param {capIDModel} capIDModel - license record ID
 */
function editLicIssueDate(capIDModel)
{
	ELPLogging.debug("Update license file DD to license issue date from intake file for record ID = "+capIDModel);
	
	ELPLogging.debug("Test ----- >")
	
	var capResult = aa.cap.getCap(capIDModel);
	var capScriptModel = capResult.getOutput();
	
	if (capScriptModel)
	{
		//set values for CAP record
		var capModel = capScriptModel.getCapModel();
		capModel.setReportedDate(new java.util.Date(queryResult.ISSUE_DATE));
		capModel.setFileDate(new java.util.Date(queryResult.ISSUE_DATE));
		
		var editResult = aa.cap.editCapByPK(capModel);
		if(!editResult.getSuccess())
		{
			var returnException = new ELPAccelaEMSEException("Error editing the CAP ASI for "+capIDModel+": "+editResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
			
		}
		return capIDModel;
	}
	else
	{
		var returnException = new ELPAccelaEMSEException("Error retrieving the CAP "+capIDModel+": "+capResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
	

}
