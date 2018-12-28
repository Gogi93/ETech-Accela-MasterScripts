/**
 * @file - EMSE_MA_INT_C_LICENSE_ASWB:
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
		OCT01_EVENYR : "OCT 01 EVENYR",
        BIRTHDATE_2YR: "BIRTHDATE 2YR"
};

/**
 * This Object (Class) encapsulates the License configuration information and actions for
 * validating and issuing licenses for ASWB exam applications/renewals.
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
				ELPLogging.debug("CONFIG", licenseConfiguration);
				lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
				lc.maskPattern = licenseConfiguration.maskPattern;
			}
		} else {
			configurations[licenseConfiguration.applicationType] = {};
			var lc = configurations[licenseConfiguration.applicationType];
			lc[licenseConfiguration.applicationSubType] = licenseConfiguration;
			if (licenseConfiguration.lastSequenceNbr != null && licenseConfiguration.maskPattern != null) {
				ELPLogging.debug("CONFIG", licenseConfiguration);				
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
  * Expiration Code : OCT 01 EVENYR
 * Expiration Interval : 2 years
 * Expiration Month : 10
 * Expiration Date : 01
 * @returns expDate - Expiration Date of prospective License
 */
LicenseData.prototype.calculateDPLExpirationDate = function(capId, issueDateObj) {
	
	if(issueDateObj == null) {
		issueDateObj = new Date();
	}
	
	var expDate = new Date();
    var today = new Date();

    // EPLACE-6223 start	
	// if(issueDateObj != null) {
	// 	var issueMonth = issueDateObj.getMonth();
	// 	var issueDate = issueDateObj.getDate();
	// 	var issueDateYear = issueDateObj.getFullYear();
		
	// 	expDate.setDate(1);
	// 	expDate.setMonth(9);
	// 	/* If current year is odd year, set the expiration date to 10/01 of the next year */
	// 	if(issueDateYear%2 != 0) {
	// 		expDate.setFullYear(issueDateYear+1);
	// 	}
	// 	/* If the current year is an even year */
	// 	else if(issueDateYear%2 == 0) {
	// 		var dateObj = "07/01/"+issueDateYear;
	// 		var boundaryDate = new Date(dateObj);
	// 		/* If current date is before 07/01, set the expiration date to 10/01 of the current year. */
	// 		if(issueDateObj < boundaryDate) {
	// 			expDate.setFullYear(issueDateYear);
	// 		}
	// 		/* If current date is after 07/01, set the expiration date to 10/01 of the next even year. */
	// 		else if(issueDateObj >= boundaryDate) {
	// 			expDate.setFullYear(issueDateYear+2);
	// 		}
	// 	}
	// }

    var bDateObj = this.getApplicantBirthDate(capId);
    var issueDateYear = issueDateObj.getFullYear();

    ELPLogging.debug("Issue Date : " + issueDateObj);
    ELPLogging.debug("Birth date : " + bDateObj);
    ELPLogging.debug(LICENSE_EXPIRATION_CODES.BIRTHDATE_2YR);           
    if((issueDateObj != null) && (bDateObj != null)) {
        var issueDateYear = issueDateObj.getFullYear();
        var nextBirthday = new Date(); nextBirthday.setMonth(bDateObj.getMonth()); nextBirthday.setDate(bDateObj.getDate());
        if (nextBirthday <= today) nextBirthday.setFullYear(today.getFullYear() + 1);

        ELPLogging.debug("Next birth day : " + nextBirthday);

        if(bDateObj.getMonth() > issueDateObj.getMonth()) {
            ELPLogging.debug("Birth date month > Issue date month. Add 2 years.");                 
            expDate.setFullYear((issueDateYear)+2);
            expDate.setMonth(bDateObj.getMonth());
            expDate.setDate(bDateObj.getDate());
        }
        else if((bDateObj.getMonth() == issueDateObj.getMonth())) {
            ELPLogging.debug("Birth date month = Issue date month.");
            if(bDateObj.getDate() > issueDateObj.getDate()){
                ELPLogging.debug("Birth date day > Issue date day. Add 2 years.");
                expDate.setFullYear((issueDateYear)+2);
                expDate.setMonth(bDateObj.getMonth());
                expDate.setDate(bDateObj.getDate());
            }
            else {
                ELPLogging.debug("Birth date day < Issue date day. Add 3 years.");
                expDate.setFullYear((issueDateYear+3));
                expDate.setMonth(bDateObj.getMonth());
                expDate.setDate(bDateObj.getDate());
            }
        }   
        else {
            ELPLogging.debug("Birth date month <> Issue date month. Add 2 years.");
            expDate.setFullYear(issueDateYear+3);
            expDate.setMonth(bDateObj.getMonth());
            expDate.setDate(bDateObj.getDate());
        }
    }
    //EPLACE-6223 end
	ELPLogging.debug("Expiration date calculated: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());				
	return expDate;
}

/**
 * The License Pattern is SEQ-BOARD-TYPECLASS (no leading zeros on SEQ)
 * @param queryResult - Configuration for a Application Type and SubType
 * @returns customID - Alt ID for the CAP
 * 
 */
LicenseData.prototype.formatLicense = function(queryResult, typeClass) {
	var boardCode = queryResult.boardCode;
	var licenseNumber = queryResult.licenseNumber;
	var licenseNumberS = licenseNumber.toString();
	var customID = licenseNumberS + "-" + boardCode + "-" + typeClass;
	return customID;
}

/**
 * This function retrieves the License Configurations from the configurations field by
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

LicenseData.prototype.getApplicationType = function(queryResult, typeClass) {
	//Check for Record Type
	var applicationTypes = null;
	var boardTypeClass = queryResult.boardCode+ "-" +typeClass;
	ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
	var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
	ELPLogging.debug("License configuration information : " +appConfigInfo);
	
	var ids = new Array();
	ids = appConfigInfo.split("/");
	applicationTypes = {};
	applicationTypes.group = ids[0];
	applicationTypes.type = ids[1];
	applicationTypes.subType = ids[2];
	applicationTypes.category = ids[3];
	this.capTypeAlias = ids[1] + " " + ids[2];
	appTypeArray = ids;
	
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
	var issueMonth = issueDateObj.getMonth();
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
	ELPLogging.debug("Setting the expiration Date : " + expDate);
	var expDateS = dateFormattedIntC(expDate, "MM/dd/yyyy");
	ELPLogging.debug("Conversion expiration Date : " + expDateS);
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
 * This function issues a new license for a ASWB Intake Application (Exam)
 * Besides creating the License, it updates the Task Status of the Application to
 * Ready for Printing, and adds the License Id to the Print Set.
 * @param capId - CAP ID of application
 * @param queryResult - ASWB information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.issueLicense = function(capId, queryResult) {

	updateAppStatus("Ready for Printing", "Updated via Script", capId);
	deactivateWFTask("Intake", capId);
	deactivateWFTask("Exam", capId);
	activateWFTask("Issuance", capId);
	updateTaskStatus("Issuance", "Ready for Printing", "","","", capId);

	var newLicId = this.createLicense(capId, queryResult, typeClass);
	ELPLogging.debug("New License Object :" + newLicId);
	ELPLogging.debug("Custom ID :" + newLicId.getCustomID());
	var srcCapId = capId;

	if (newLicId != null) {
		var fvShortNotes = getShortNotes(capId);
		updateShortNotes(fvShortNotes,newLicId);
		setContactsSyncFlag("N", newLicId);
		
		reportName = queryResult.boardCode+"|LICENSE_REGISTRATION_CARD";
		
		callReport(reportName, false, true, "DPL License Print Set", capId);
		
		var appCreatedBy = this.getCreatedBy(capId);
		if (appCreatedBy != null) {
			editCreatedBy(appCreatedBy, newLicId);			
		}
	}
	return newLicId;
}


/**
 * This function creates the License and returns the new License Id (CAP ID)
 * @param capId - CAP ID of Application
 * @param queryResult - ASWB information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.createLicense = function(lcapId, queryResult, typeClass) {
	var licHolderType = "Licensed Individual";
	var contactType = "Applicant";
	var initStatus = "Current";
	ELPLogging.debug("contactType :" + contactType);
	ELPLogging.debug("licHolderType :" + licHolderType);

    var newLic = null;
    var newLicId = null;
    var newLicIdString = null;
    var boardCode = queryResult.boardCode;
    var oldAltID = null;
    var AltIDChanged = false;

    var types = this.getApplicationType(queryResult, typeClass);

    //create the license record
    //unfortunately requires global capId
    capId = lcapId;
	ELPLogging.debug("Group : " + types.group + "Type : " + types.type + "SubType : " + types.subType);
    newLicId = createParent(types.group, types.type, types.subType, "License", null);
    ELPLogging.debug("New License Id : "+newLicId);
    // Remove the ASI and Template tables from all contacts.
    removeContactTemplateFromContact(newLicId);

     if(queryResult.licIssueDate!=null)
	{
	   editLicIssueDate(newLicId);
	}

	// Use the license issue date as the sysDate
    var sysDate = formatIntoDate(queryResult.licIssueDate);
    var sysDateMMDDYYYY = dateFormattedIntC(sysDate,"");
    ELPLogging.debug("sysDateMMDDYYYY " + sysDateMMDDYYYY);
    var rDate = new Date(sysDateMMDDYYYY);
    ELPLogging.debug("sysDateMMDDYYYY ", rDate);
    ELPLogging.debug("sysDateMMDDYYYY " + rDate.getTime());

    editFirstIssuedDate(sysDateMMDDYYYY, newLicId);
    oldAltID = newLicId.getCustomID();

    var asiTypeClass = typeClass;
    var licenseNo = queryResult.licenseNumber;
    ELPLogging.debug("Board Code : " + boardCode);
    ELPLogging.debug("Type Class : " + asiTypeClass);
    ELPLogging.debug("License No : " + licenseNo);

    //change license Alt ID
	ELPLogging.debug("asiTypeClass : " + asiTypeClass);
	
	var scanner = new Scanner(oldAltID.toString(),"-");
	var licenseNumber = scanner.next();
	var newAltID = (queryResult.licenseNumber).toString()+ "-"+scanner.next()+"-"+scanner.next();

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
	var vExpDate = this.calculateDPLExpirationDate(newLicId, formatIntoDate(queryResult.licIssueDate));
	this.setLicExpirationDate(newLicId, vExpDate);
	
	ELPLogging.debug("Set the license expirationDate as : "+ vExpDate);
	vExpDate = convertDateToScriptDateTime(vExpDate);
	ELPLogging.debug("Converted to Script date time : "+ vExpDate);
	ELPLogging.debug("Creating Ref LP.");
	
	var licNumberArray = newAltID.split("-");
	var licenseNumber = licNumberArray[0];
	var boardName = licNumberArray[1];
	var licenseType = licNumberArray[2];
	
	// Create the reference license
	createRefLicProf(licenseNumber, boardName, licenseType, contactType, initStatus, vExpDate);
	ELPLogging.debug("Created Reference License Professional");

	newLic = getRefLicenseProf(licenseNumber, boardName, licenseType);
	ELPLogging.debug("New reference license professional : " +newLic);

	if (newLic) {
		if(queryResult.licIssueDate!=null)
		{
			ELPLogging.debug("Updating the license issue date on LP from intake file.");
			updateLicenseIssueDateOnLP(licenseNumber, boardName, licenseType, newLic, queryResult);
		}
		ELPLogging.debug("Reference LP successfully created");
		associateLpWithCap(newLic, newLicId);
	} else {
		ELPLogging.debug("Reference LP not created");
	}
    
    /* JIRA 2356 - Start: updated license issue and expiration date on b3contra table */
    licExpirationDate = vExpDate;
    licenseProfessional = getLicenseProfessional(newLicId);
    
    if(queryResult.licIssueDate!=null)
	{
		sysDate = queryResult.licIssueDate;
	}
    else
    {
        sysDate = new Date();
    }
	var vIssueDate = convertDateToScriptDateTime(formatIntoDate(sysDate));
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
    /* JIRA 2356 - End: updated license issue and expiration date on b3contra table */

	conToChange = null;
	cons = aa.people.getCapContactByCapID(newLicId).getOutput();
	ELPLogging.debug("Contacts:" + cons);
	ELPLogging.debug("Contact Length:" + cons.length);

	for (thisCon in cons) {
		ELPLogging.debug("Contact Type is : " +cons[thisCon].getCapContactModel().getPeople().getContactType());
		if (cons[thisCon].getCapContactModel().getPeople().getContactType() == contactType) {	
			conToChange = cons[thisCon].getCapContactModel();
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
 * This function validates the License Number
 * If valid, it increments the value in the configurations
 * @param capId - CAP ID of Application
 * @param queryResult - data
 * @returns boolean - true if number is valie, false if number is not valid
 */
LicenseData.prototype.validateLicenseNumber = function(queryResult, appConfigInfo, typeClass) {
	ELPLogging.debug("Validating License Number");
	var types = this.getApplicationTypeForAppRecord(appConfigInfo);
	ELPLogging.debug("types : " + types);
	var lastSequenceNbr = this.configurations[types.capTypeAlias].lastSequenceNbr;
	
	ELPLogging.debug("Last sequence number : " + lastSequenceNbr);
	
	var inputLicNo = Number(queryResult.licenseNumber);
	ELPLogging.debug("input License number : " +inputLicNo);
	
	var resendFlag = false;
	
	var validationFlagArray = {};
	validationFlagArray.resendFlag = resendFlag;
	
	var validationResult = false;
	
	var loopBreaker = true;
	if(!isNaN(inputLicNo))
	{
		while(loopBreaker)
		{		
			if (inputLicNo == lastSequenceNbr)
			{
				ELPLogging.debug(inputLicNo +" == "+ lastSequenceNbr)
				ELPLogging.debug("Input license number is equals to lastSequenceNbr");
				lastSequenceNbr = ++this.configurations[types.capTypeAlias].lastSequenceNbr;
				this.updateLicenseSequenceNumbers();
				validationFlagArray.validationResult = true;
				loopBreaker = false;
			}
			else if (inputLicNo < lastSequenceNbr)
			{
				ELPLogging.debug(inputLicNo +" < "+ lastSequenceNbr);
				validationFlagArray.resendFlag = true;
				validationFlagArray.validationResult = true;
				loopBreaker = false;
			}
			else
			{	
				ELPLogging.debug(inputLicNo +" > "+ lastSequenceNbr);
				var recordID = "";
				
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
				}
				
				ELPLogging.debug("Updating error table for input license number is greater than last sequence number.");
				var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Expected license sequence number is " + lastSequenceNbr;
				
				var errorTableUpdateParameters = {"BatchInterfaceName": dynamicParamObj.batchInterfaceName, "RecordID" : recordID, "ErrorDescription":errorDescription, "runDate": RUN_DATE};
		
				callToStoredProcedure(errorTableUpdateParameters, "errorTableInsert");
				
				lastSequenceNbr = ++this.configurations[types.capTypeAlias].lastSequenceNbr;

				ELPLogging.debug("lastSequenceNbr = " +lastSequenceNbr);
			}
		}
	}
	else
	{
		ELPLogging.debug("License number contains Alpha characters.");
		validationFlagArray.resendFlag = resendFlag;
		validationFlagArray.validationResult = validationResult;
	}
	
	
	return validationFlagArray;
}

/**
 * @desc This method will update license issue date on LP.
 * @param {rlpId} rlpId - contains license number`
 * @param {ipBoadName} ipBoadName - contains  board name
 * @param {rlpType} rlpType - contains LP type.
 * @param {newLic} newLic - contains new license ID.
 * @param {queryResult} queryResult - contains query result.
 */
function updateLicenseIssueDateOnLP(rlpId, ipBoadName, rlpType, newLic, queryResult)
{
	ELPLogging.debug("Updating license issue date on LP : "+newLic);
	var licenseIssueDate = queryResult.licIssueDate;
	
	var rlpBoadName = getLegalBoardName(ipBoadName);
	newLic.setServiceProviderCode(aa.getServiceProviderCode());
	newLic.setAgencyCode(aa.getServiceProviderCode());
	
	newLic.setStateLicense(rlpId);
	newLic.setBusinessLicense(rlpType);
	newLic.setLicenseBoard(rlpBoadName);
	
	var vIssueDate = convertDateToScriptDateTime(formatIntoDate(licenseIssueDate));
	
	ELPLogging.debug("before Successfully updated License Issue Date. "+newLic.getLicenseIssueDate());
	
	newLic.setLicOrigIssDate(vIssueDate);
	newLic.setLicenseIssueDate(vIssueDate);
		
    ELPLogging.debug("After Successfully updated License Issue Date. "+newLic.getLicenseIssueDate());

		
	myResult = aa.licenseScript.editRefLicenseProf(newLic);
	
	if (myResult.getSuccess()) {
		ELPLogging.debug("Successfully updated License Issue Date. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
		
	} else {
		ELPLogging.debug("**ERROR: can't update the License Issue Date: " + myResult.getErrorMessage());
	}
	
}

/**
 * @desc This method creates record in the Accela system
 * @param {group} contains group name of the record.
 * @param {type} contains type of the record.
 * @param {subType} contains sub type of the record.
 * @param {category} contains category of the record.
 * @throws ELPAccelaEMSEException
 */
function createCAP(group, type, subType, category)
{
	ELPLogging.debug("Creating CAP in Accela system.");
	var licenseIssueDate = queryResult.licIssueDate;
	licenseIssueDate = formatIntoDate(licenseIssueDate);
	ELPLogging.debug("licenseIssueDate = "+new java.util.Date(licenseIssueDate));
	
    var createCapResult = aa.cap.createApp(group, type, subType, category, null);
    var capIDModel = createCapResult.getOutput();
    ELPLogging.debug("CAP record "+capIDModel+" has been created.");
    
    if (capIDModel) 
    {
    	var capResult = aa.cap.getCap(capIDModel);
        var capScriptModel = capResult.getOutput();
		
        if (capScriptModel)
        {
			//set values for CAP record
            var capModel = capScriptModel.getCapModel();
        	capModel.setCapStatus("Submitted");	
            capModel.setCapClass("COMPLETE");	
            capModel.setReportedDate(new java.util.Date(licenseIssueDate));
            capModel.setFileDate(new java.util.Date(licenseIssueDate));
            
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
    else
    {
    	var returnException = new ELPAccelaEMSEException("Error creating the CAP : "+createCapResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException;
	}
}

/**
Convert the string input to a valid date value
*/
function formatIntoDate(strDateValue){
	var newDate = strDateValue.substring(0,2)+"/"+strDateValue.substring(2,4)+"/20"+strDateValue.substring(4,6);
	return new Date(newDate);
}

/**
Convert the string input to a valid date value
*/
function formatBirthDate(strDateValue){
	var newDate = strDateValue.substring(0,2)+"/"+strDateValue.substring(2,4)+"/19"+strDateValue.substring(4,6);
	return new Date(newDate);
}

/**
 * This function converts a JS Date to a Accela ScriptDateTime
 * @param jsDate - JS Date
 * @returns accelaDate - ScriptDateTime
 */
function convertDateToScriptDateTime(jsDate) {
	var utilDate = convertDateToJavaDate(jsDate);
	var accelaDate = aa.date.getScriptDateTime(utilDate);	
	ELPLogging.debug("convertDateToScriptDateTime updated License Issue Date. "+accelaDate);
	
	return accelaDate;
}

/**
 * This function converts a JS Date to a Java Util Date
 * @param jsDate - JS Date
 * @returns utilDate - Java Util Date
 */
function convertDateToJavaDate(jsDate) {
	var utilDate = new java.util.Date(jsDate.getTime());
		ELPLogging.debug("convertDateToJavaDate updated License Issue Date utilDate  "+utilDate );
	
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

/**
 * Retrieves the Application Types (group, type, subType, category) for the capId
 * @param capId - CAP ID for a Record
 * @returns applicationTypes - An Object consisting of
 * 		group - B1_PER_GROUP
 * 		type - B1_PER_TYPE
 * 		subType - B1_PER_SUBTYPE
 * 		category - B1_PER_CATEGORY
 */
LicenseData.prototype.getApplicationTypeForAppRecord = function(appConfigInfo) {
	ELPLogging.debug("Retrieve application types for Application record.");
	//Check for Record Type
	var applicationTypes = null;
	applicationTypes = {};
	
	var ids = appConfigInfo.split("/");
	applicationTypes.group = ids[0];
	applicationTypes.type = ids[1];
	applicationTypes.subType = ids[2];
	applicationTypes.category = ids[3];
	applicationTypes.capTypeAlias = ids[1] + " " + ids[2];
	
	return applicationTypes;
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
 * @desc This method is performing validation for Social security number.
 * @param {socSecNumber} contains social security number from staging table.
 * @returns {SSNValidationArray} - Contains boolean value
 */
function validateSSN(socSecNumber) 
{
	var SSNValidationArray = new Array();
	//Used as validation flag
	var validationFlag;
	
	//Used to add condition on the SSN when regular expression fails
	var conditionFlag;
	
	ELPLogging.debug("Validating SSN : " +socSecNumber);
	//Check for alpha characters
	//If SSN contains alpha characters then set validation flag to False
	if(!isNaN(socSecNumber))
	{	
		//SSNValidationArray.validationFlag = true;
		//If SSN did not matches regular expression value then set conditionFlag to true
	    if((socSecNumber.toString()).match(/^(?!\b(\d)\1+\b)(?!123456789|219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/))
		{
			ELPLogging.debug("Pattern did not matched Matched. Do not any add condition.");
			SSNValidationArray.conditionFlag = false;
			SSNValidationArray.validationFlag = true;
		}
		else
		{
			SSNValidationArray.conditionFlag = true;
			SSNValidationArray.validationFlag = false;
		}
	}
	else
	{
		ELPLogging.debug("Invalid SSN - SSN contains alpha numeric characters.")
		SSNValidationArray.validationFlag = false;
		SSNValidationArray.conditionFlag = false;
	}	
	
	return SSNValidationArray;
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
	peopleModel.setFirstName(queryResult.firstName);
	peopleModel.setLastName(queryResult.lastName);
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
* @desc: This method creates a set on a monthly basis for each board in a exam vendor file.
* 		 If the set already exists for the month it should not create a new one and simply return the existing set name		
* @param: {String} boardCode - contains the board code.
* @param: {String} vendor - contains the vendor name.
*/
function getMonthlyPaymentSet(boardCode, vendor)
{
	ELPLogging.debug("Creating monthly payment set.");
	var pJavaScriptDate = new Date();
	
	month = pJavaScriptDate.getMonth()+1;
	
	if(month < 10)
	{
		var formattedMonth = "0"+month;
	}
	else
	{
		var formattedMonth = month;
	}
		
	var dateStr = formattedMonth+"_"+pJavaScriptDate.getFullYear();

	// Set name to be created

	var setName = "DPL_"+vendor+"_EXAM_"+boardCode+"_" +dateStr;
	
	//Check if set already exist.
	var setResult = aa.set.getSetByPK(setName);
	
	if(setResult.getSuccess())
	{
		ELPLogging.debug("Monthly payment set: "+ setName+ " already exists.");
	}
	else
	{
		// Create a new set if it does not already exists.
		var newSetResult = aa.set.createSet(setName,setName);
		if(newSetResult.getSuccess())
		{
			ELPLogging.debug("Successfully created Set: " +setName);
		}
		else
		{
			ELPLogging.debug("Unable to create set "+setName+" : \n Error: "+ScriptReturnCodes.EMSE_PROCEDURE);
		}
	}
	
	return setName;
 }

 /** 
 * @desc This method checks that application record is present in the set or not.If it is not then add application
 * record to the monthly payment set.
 * @param {setName} contains the set name
 * @param {capID} contains the record ID
 * @return {boolean}
 */ 
function addApplicationRecordToMonthlyPaymentSet(setName, capId)
{
	ELPLogging.debug("Adding Application record: "+capId +" to monthly payment set : "+setName);
	
 	var scanner = new Scanner(capId.toString(),"-");
 	var id1 = scanner.next();
 	var id2 = scanner.next();
 	var id3 = scanner.next();
 	
 	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
 	setDetailScriptModel.setSetID(setName);
 	setDetailScriptModel.setID1(id1);
 	setDetailScriptModel.setID2(id2);
 	setDetailScriptModel.setID3(id3);
 	
 	var memberListResult = aa.set.getSetMembers(setDetailScriptModel);
 	
 	if(memberListResult.getSuccess())
 	{
 		var memberList = memberListResult.getOutput();
 		//If the member list size is more than zero then record is not present in the set
 		if(memberList.size())
 		{
 			ELPLogging.debug("Application record : " +capId+" already exists in the Set : " +setName);
 		}
 		else
 		{
 			aa.set.add(setName,capId);
			ELPLogging.debug("Application record : " +capId+" successfully added in the Set : " +setName);
 		}
 		return true;
 	}
 	return false;
}

/** 
 * @desc The Method creates the contact record.
 * @param capIDModel : capIDModel.
 * @param queryResult : Contains dataSet of ASWB Staging table.
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
        peopleModel.setFirstName(queryResult.firstName);
        peopleModel.setLastName(queryResult.lastName);
		peopleModel.setMiddleName(queryResult.middleInit);
		
		var ssn = formatSSN(queryResult.socSecNumber);
		peopleModel.setSocialSecurityNumber(ssn);
		peopleModel.setServiceProviderCode("DPL");
        peopleModel.setAuditStatus("A");
        peopleModel.setStartDate(new java.util.Date());
        peopleModel.setAuditID("BATCHUSER");
		peopleModel.setBirthDate(formatBirthDate(queryResult.dateOfBirth));
        capContactModel.setPeople(peopleModel);
        
        capContactModel.setCapID(capIDModel);
		
		var createContactResult = aa.people.createCapContact(capContactModel).getOutput();
		
		// Call the method to get the contact sequence number.
		var contactId = getContactId(capIDModel);
		
		// Create an address entry on contact.
		createContactAddress(contactId, queryResult, capIDModel, contactAddressObject.addressType);		
		
		// Creating the Reference contact from transaction contact.
		var peopleModel = new com.accela.aa.aamain.people.PeopleModel();
		var ssn = formatSSN(queryResult.socSecNumber);
		peopleModel.setSocialSecurityNumber(ssn);
		var opUserExists = refContactExistsBySSN(peopleModel);
		ELPLogging.debug("opUserExists----" + opUserExists);
		//refContactNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel, "Applicant", null, true, opUserExists);
		refContactNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel,null,null,false,false, peopleDuplicateCheck)
		setContactsSyncFlag("N", capIDModel);
	}
	else
	{
		ELPLogging.debug("Error creating a people model for "+capIDModel+": "+peopleScriptModelResult.getErrorMessage());
	}
}


/** 
 * @desc The Method creates the contact record.
 * @param contactId : Contact sequence number.
 * @param queryResult : Contains dataSet of ASWB Staging table.
 * @param capID : cap ID Model.
 * @throws  N/A
 */ 
function createContactAddress(capIDModel, contactSeqNumber, contactAddressDetailsArray)
{
	ELPLogging.debug("Create contact address for contact sequence number : " +contactSeqNumber);
	    
	//set the address values
	var capContactAddressModel = new com.accela.orm.model.address.ContactAddressModel();
	
	capContactAddressModel.setAddressLine1(contactAddressDetailsArray.addressLine1);
	capContactAddressModel.setAddressLine2(contactAddressDetailsArray.addressLine2);
    capContactAddressModel.setCity(contactAddressDetailsArray.city);
    capContactAddressModel.setState(contactAddressDetailsArray.state);
	
	var zipCode=null;
	if((contactAddressDetailsArray.zipCodeB != null) && (contactAddressDetailsArray.zipCodeB != '0' && contactAddressDetailsArray.zipCodeB != '00' && contactAddressDetailsArray.zipCodeB != '000' && contactAddressDetailsArray.zipCodeB != '0000'))
	{
		zipCode = contactAddressDetailsArray.zipCodeA+"-"+contactAddressDetailsArray.zipCodeB;
	}
	else
	{
		zipCode = contactAddressDetailsArray.zipCodeA;
	}
    capContactAddressModel.setZip(zipCode);
    
    capContactAddressModel.setCountryCode("US");		
    capContactAddressModel.setEntityType("CAP_CONTACT");	
    capContactAddressModel.setAddressType("Mailing Address");
    capContactAddressModel.setEntityID(contactSeqNumber);
    
	var createContactAddressResult = aa.address.createCapContactAddress(capIDModel,capContactAddressModel);

	if(!createContactAddressResult.getSuccess())
	{
		var returnException = new ELPAccelaEMSEException("Error creating the Contact Address for "+capIDModel+": "+createContactAddressResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc This method retrieves the contact sequence number of a contact on the specified CAP record with the specified contact type
 * @param {capIdModel} capIDModel - contains the cap id of the CAP record.
 * @return {string} contactSeqNumber - contains the contact sequence number of the contact.
 * @throws ELPAccelaEMSEException
 */
function getContactSeqNumber(capIDModel)
{
	ELPLogging.debug("Retrieve contact sequence number for record : " +capIDModel);
	var contactSeqNumber = null;
	//retrieve list of contacts for the record
    var capContactResult = aa.people.getCapContactByCapID(capIDModel);
    var capContactList = capContactResult.getOutput();
    
	if(capContactList)
	{
    	//loop through the list of contacts
        for(index in capContactList)
        {
			//Get contact sequence number
	        contactSeqNumber = capContactList[index].getPeople().getContactSeqNumber();
	        contactSeqNumber = aa.util.parseLong(contactSeqNumber);
	        ELPLogging.debug("contactSeqNumber = " +contactSeqNumber);
			
	        return contactSeqNumber;            
        }
    }
    else
    {
    	var returnException = new ELPAccelaEMSEException("Error retrieving the contact list for "+capIDModel+": "+capContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException;
	}
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
    
	addressModel.setAddressLine1(queryResult.busAddressLine1);
	addressModel.setAddressLine2(queryResult.busAddressLine2);
    addressModel.setCity(queryResult.busCity);
    addressModel.setState(queryResult.busState);
    addressModel.setZip(queryResult.busZipA);
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

LicenseData.prototype.checkLicenseNumber = function(queryResult, typeClass) {
	var newAltID = this.formatLicense(queryResult, typeClass);
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
	ELPLogging.debug("Update license file DD to license issue date of ASWB from intake file for record ID = "+capIDModel);
	
	
	var capResult = aa.cap.getCap(capIDModel);
	var capScriptModel = capResult.getOutput();
	
	if (capScriptModel)
	{
         	//set values for CAP record
		var capModel = capScriptModel.getCapModel();
		
		capModel.setReportedDate(formatIntoDate(queryResult.licIssueDate));
		capModel.setFileDate(formatIntoDate(queryResult.licIssueDate));
		
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