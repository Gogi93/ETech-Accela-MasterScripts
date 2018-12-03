/**
 * @file - EMSE_MA_INT_C_LICENSE_PSV:
 * This file contains the Script to provide License Configuration information on
 * the requested License types
 */
var SCRIPT_VERSION = "3.0";
var intLicenseTesting = false;
var capTypeAlias;
  var licenseProfessional;
 var licExpirationDate;

var applicationID;
if (intLicenseTesting)
{
    function getScriptText(vScriptName) 
    {
            vScriptName = vScriptName.toUpperCase();
            var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),
                                             vScriptName, "ADMIN");
            return emseScript.getScriptText() + "";
    }

    /**
     * load Batch Common and EMSE Common JavaScript Files
     */
    try 
    {
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
    } 
    catch (ex)
    {
        var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
}

/**
 * override logDebug() for ELPLogging applications
 * @param message
 */
function logDebug(message) 
{
    ELPLogging.debug(message);
}

/**
 * @desc returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
 * @param {Date} dateObj - JavaScript Date
 * @param {string} pFormat - Date format
 * @returns {string} Formatted Date
 */

function dateFormattedIntC(dateObj,pFormat){
    ELPLogging.debug("Inside dateFormattedIntC.");
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
        BIRTHDATE_2YR: "BIRTHDATE 2YR",
        DEC31_ODDYR : "DEC31 ODD YEAR"
};

/**
 * This Object (Class) encapsulates the License configuration information and actions for
 * validating and issuing licenses for exam applications/renewals.
 */
function LicenseData(databaseConnection, parameters) 
{
    this.dbConnection = databaseConnection;
    this.parameters = parameters;
    this.configurations = this.getLicenseData(parameters);
    //this.applicationID = null;
    
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
 *      servProvCode - Service Provider Code (required)
 *      applicationType - Application Type (e.g., "Sheet Metal")    (optional)
 *      applicationSubType - Application SubType (e.g., "Journeyperson") (optional)
 * @returns configurations - Object consisting of
 *  {   
 *      type1 : {
 *          lastSequenceNbr : 221   // copied from SubType, one number for each Type
 *          subType1 : {
 *              servProvCode :              // Service Provider Code (DPL)
 *              applicationType :           // Application Type (Sheet Metal)
 *              applicationSubType :        // Application SubType (Journeyperson)
 *              expirationCode :            // Expiration Code (28TH BIRTH MONTH 2YR)
 *              description :               // Application Type Alias (Sheet Metal Journeyperson License)
 *              expirationInterval :        // Expiration Interval, # of units (2)
 *              expirationUnits :           // Expiration Units, Years, Months, Days (Years)
 *              expirationMonth :           // Expiration Month, Code can override (1)
 *              expirationDay :             // Expiration Day (28)
 *              maskPattern :               // Mask Pattern, not used ($$SEQ$$-SM-J1)
 *              lastSequenceNbr :           // Last Sequence Number used (221)
 *          }
 *          .....
 *      }
 *      .....
 * }
 *              
 */
LicenseData.prototype.getLicenseData = function(parameters) {
    var returnException;
    var createConnection = false;

    try 
    {
        if (this.dbConnection == null) 
        {       
            /*
             * get Standard Choice for Connection Information
             */
            var connectionStandardChoice = getDBConnectionInfo(this.procedureConfiguration.connectionInfoSC);
            if (connectionStandardChoice == null)
            {
                var message = "Cannot find Connection Information Standard Choice: " + procedureConfiguration.connectionInfoSC;
                returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
                ELPLogging.fatal(returnException.toString());
                throw returnException;      
            }
            //Create a connection to the Staging Table Database
            this.dbConnection = DBUtils.connectDB(connectionStandardChoice.connectionInfo); 
            createConnection = true;
        }
        for (var ii = 0; ii < this.procedureConfiguration.supplemental.length; ii++) 
        {
            var supplementalConfiguration = this.procedureConfiguration.supplemental[ii];
            if (supplementalConfiguration.tag == "licenseConfigurationDPL") 
            {
                var getLicenseConfigurationProcedure = new StoredProcedure(supplementalConfiguration.procedure, this.dbConnection); 
                break;
            }
        }

        if (getLicenseConfigurationProcedure == null )
        {
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
        // getLicenseConfigurationProcedure.prepareStatement();
        // var inputParameters = getLicenseConfigurationProcedure.prepareParameters(null,null,parameters);
        // ELPLogging.debug("     InputParameters for getLicenseConfigurationProcedure:", inputParameters);
        // getLicenseConfigurationProcedure.setParameters(inputParameters);
        // var dataSet = getLicenseConfigurationProcedure.queryProcedure();
        ELPLogging.debug("*** Finished getLicenseConfigurationRecords() ***");
        
        // loop through all license configuration records
        var licenseConfiguration = null;
        var configurations = {};
        while ((licenseConfiguration = dataSet.next()) != null) 
        {
            if (configurations[licenseConfiguration.applicationType] != null) 
            {   
                var lc = configurations[licenseConfiguration.applicationType];
                lc[licenseConfiguration.applicationSubType] = licenseConfiguration; 
                if (licenseConfiguration.lastSequenceNbr != null) 
                {
                    ELPLogging.debug("CONFIG - Has applicationType", licenseConfiguration);
                    lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
                }
            } 
            else 
            {
                configurations[licenseConfiguration.applicationType] = {};
                var lc = configurations[licenseConfiguration.applicationType];
                lc[licenseConfiguration.applicationSubType] = licenseConfiguration;
                if (licenseConfiguration.lastSequenceNbr != null) 
                {
                    ELPLogging.debug("CONFIG - No applicationType", licenseConfiguration);              
                    lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
                }           
            }
        } 
    }  
    finally
    {
        if (dataSet != null) 
        {
            dataSet.close();
        }
        if (getLicenseConfigurationProcedure != null) 
        {
            getLicenseConfigurationProcedure.close();
        }
        if (createConnection && (this.dbConnection != null)) 
        {
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
LicenseData.prototype.calculateDPLExpirationDate = function(queryResult, appConfigInfo, issueDateObj) {
    ELPLogging.debug("Calculating DPL license expiration date.");
    //Variables
    var bDateObj;
    
    var expDate = new Date();
    if (issueDateObj == null)
    {
        issueDateObj = expDate;
    }

    //Check for Record Type
    var applicationType = this.getApplicationTypeForAppRecord(appConfigInfo);
    ELPLogging.debug("Record Type: " + applicationType.type + "/" + applicationType.subType);
    
    if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "2"))
    {
        if(queryResult.shouldAppCreate)
        {
            ELPLogging.debug("--1--");
            applicationType.capTypeAlias = "Cosmetology Type 2";
            applicationType.subType = "Type 2";
        }
        else
        {
            ELPLogging.debug("--2--");
            applicationType.capTypeAlias = "Cosmetology Type 1";
            applicationType.subType = "Type 1";
        }
        
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "7"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 7";
        applicationType.subType = "Type 7";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "3"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 3";
        applicationType.subType = "Type 3";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "4"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 4";
        applicationType.subType = "Type 4";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="8"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 8";
        applicationType.subType = "Type 8";
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass =="1"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 1";
        applicationType.subType = "Type 1";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="6"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 6";
        applicationType.subType = "Type 6";
    }
    /*else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="5"))
    {
        applicationType.capTypeAlias = "Cosmetology Type 5";
        applicationType.subType = "Type 5";
    }*/
    
    ELPLogging.debug("applicationType.capTypeAlias : "+applicationType.capTypeAlias+" applicationType.subType : "+applicationType.subType);
    
    var licenseData = this.retrieveLicenseData(applicationType.capTypeAlias, applicationType.subType);
    ELPLogging.debug("Expiration code is : " +licenseData.expirationCode);
    
    var expirationCode = String(licenseData.expirationCode);
        switch (expirationCode)
        {
            case LICENSE_EXPIRATION_CODES.FEB28_1YR:
                ELPLogging.debug(LICENSE_EXPIRATION_CODES.FEB28_1YR);           
                if(issueDateObj != null) 
                {
                    var issueMonth = issueDateObj.getMonth();
                    var issueDate = issueDateObj.getDate();
                    var issueDateYear = issueDateObj.getFullYear();
                                      
                    if (this.withinExpirationBoundary(issueDateObj, licenseData)) {
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
                var bDateObj = queryResult.dateOfBirth;
                ELPLogging.debug("bDateObj : " +bDateObj);
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
            case LICENSE_EXPIRATION_CODES.BIRTHDATE_2YR:
                var bDateObj = queryResult.dateOfBirth;
                var dateOfBirth = new Date(bDateObj);
                ELPLogging.debug("Birth date : "+dateOfBirth);
                ELPLogging.debug(LICENSE_EXPIRATION_CODES.BIRTHDATE_2YR);
                
                if(queryResult.boardCode == "HD")
                {
                    if(issueDateObj != null)
                    {
                        //var expDate = new Date();
                        var currentDate =  new Date();
                        // issue date details
                        //var issueDateObj = queryResult.licIssueDate;
                        //var issueDate = new Date(issueDateObj);
                        
                        var bDateObj = queryResult.dateOfBirth;
                        var birthDate = new Date(bDateObj);
                        
                        var issueDateYear = issueDateObj.getFullYear();
                        var issueMonth = issueDateObj.getMonth()+1;
                        var issueDay = issueDateObj.getDate();
                        ELPLogging.debug("issueDateYear = "+issueDateYear+" issueMonth = "+issueMonth+" issueDay  = "+issueDay);
                        
                        //birth date details
                        var birthYear = birthDate.getFullYear();    
                        var birthMonth = birthDate.getMonth()+1;
                        var birthDay = birthDate.getDate();
                        ELPLogging.debug("birthYear = "+birthYear+" birthMonth = "+birthMonth+" birthDay = "+birthDay);
                        
                        if(currentDate.getFullYear() == issueDateYear)
                        {
                            ELPLogging.debug("issueMonth : "+issueMonth+ " <= ? birthMonth :"+birthMonth+" && issueDay : "+issueDay+" <= ? birthDay : "+birthDay);
                            if((issueMonth < birthMonth) ||  ((issueMonth == birthMonth) && (issueDay <=  birthDay)))
                            {
                                ELPLogging.debug("if the application is approved before the birth month and date of the applicant, in the same calendar year, then set the expiration date as the birth month/date of the current year + 1 year.");
                                expDate.setDate(birthDay);
                                expDate.setMonth(birthDate.getMonth());
                                expDate.setFullYear(currentDate.getFullYear()-1);
                            }
                            else
                            {
                                ELPLogging.debug("If the application is approved after the birth month and date of the applicant, in the same calendar year, then set the expiration date as the birth month/date of the current year + 2 years.");
                                expDate.setDate(birthDay);
                                expDate.setMonth(birthDate.getMonth());
                                expDate.setFullYear(currentDate.getFullYear());
                            }
                        }
                        ELPLogging.debug("Exp date1 : "+expDate);
                    }
                }
                else
                {
                    if((issueDateObj != null) && (dateOfBirth != null)) 
                    {
                        var issueDateYear = issueDateObj.getFullYear();
                        if(dateOfBirth.getMonth() > issueDateObj.getMonth()) 
                        {
                            expDate.setFullYear((issueDateYear));
                            expDate.setMonth(dateOfBirth.getMonth());
                            expDate.setDate(dateOfBirth.getDate());
                        }
                        else if((dateOfBirth.getMonth() == issueDateObj.getMonth())) 
                        {
                            if(dateOfBirth.getDate() > issueDateObj.getDate())
                            {
                                expDate.setFullYear((issueDateYear));
                                expDate.setMonth(dateOfBirth.getMonth());
                                expDate.setDate(dateOfBirth.getDate());
                            }
                            else 
                            {
                                expDate.setFullYear((issueDateYear+1));
                                expDate.setMonth(dateOfBirth.getMonth());
                                expDate.setDate(dateOfBirth.getDate());
                            }
                        }   
                        else
                        {                               
                            expDate.setFullYear(issueDateYear+1);
                            expDate.setMonth(dateOfBirth.getMonth());
                            expDate.setDate(dateOfBirth.getDate());
                        }
                    }
                }
                break;
        case LICENSE_EXPIRATION_CODES.DEC31_ODDYR:
            ELPLogging.debug(LICENSE_EXPIRATION_CODES.DEC31_ODDYR);         
            if(issueDateObj) {
                var issueMonth = issueDateObj.getMonth();
                var issueDate = issueDateObj.getDate();
                var issueDateYear = issueDateObj.getFullYear();
              
                var baseLineDate = new Date();
                baseLineDate.setDate(1);
                baseLineDate.setMonth(9);
                baseLineDate.setFullYear(issueDateYear);
              
                expDate.setDate(1);                       
                expDate.setMonth(licenseData.expirationMonth - 1);
                expDate.setDate(licenseData.expirationDay); 
                    
                if(issueDateYear%2 != 0){
                    // If issue Date year is odd, then keep it same or add 2 years.
                    if(issueDateObj < baseLineDate){
                        expDate.setFullYear((issueDateYear-2));
                    }
                    else {
                        expDate.setFullYear((issueDateYear));
                    }
                }
                else {
                    // If issue Date year is even, then Add one year 
                    expDate.setFullYear((issueDateYear-1));
                }
            }
            break;
            default:
                ELPLogging.debug("DEFAULT " + licenseData.expirationCode);
                break;
        }
        
        ELPLogging.debug("Expiration date to pass: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());       
        if(licenseData.expirationUnits == null) 
        {
            var returnException = new ELPAccelaEMSEException("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode(), ScriptReturnCodes.EMSE_PROCEDURE);
            ELPLogging.debug(returnException.toString());
            throw returnException;
        }

        if(licenseData.expirationUnits == "Days")
        {
            expDate.setDate(expDate.getDate + licenseData.expirationInterval);
        }

        if(licenseData.expirationUnits == "Months")
        {
            var day = expDate.getDate();
            expDate.setMonth(expDate.getMonth() + pMonths);
            if (expDate.getDate() < day)
            {
                expDate.setDate(1);
                expDate.setDate(expDate.getDate() - 1);
            }
        }

        if(licenseData.expirationUnits == "Years") 
        {
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
    if(capContactResult.getSuccess()) 
    {
        capContactResult = capContactResult.getOutput();
        for(i in capContactResult) 
        {
            var peopleModel = capContactResult[i].getPeople();
            var contactType = String(peopleModel.getContactType());
            if(contactType == "Applicant" ) 
            {
                var capContactScriptModel = capContactResult[i];
                var capContactModel = capContactScriptModel.getCapContactModel();
                var bDate = capContactModel.getBirthDate();
                if(bDate != null) 
                {
                    bDateObj = new Date(bDate.getTime());
                    ELPLogging.debug("Birth date:" + (bDateObj.getMonth() + 1) + "/" + bDateObj.getDate() + "/" + bDateObj.getFullYear());
                }   
            }
        }   
    }
    return bDateObj;
}

/**
 * The License Pattern is SEQ-BOARD-TYPECLASS (no leading zeros on SEQ)
 * @param queryResult - Configuration for a Application Type and SubType
 * @returns customID - Alt ID for the CAP
 * 
 */
LicenseData.prototype.formatLicense = function(queryResult) {
    var boardCode = queryResult.boardCode;
    var typeClass;
    
    if (boardCode == "RA" && queryResult.typeClass == "TR")
    {
        ELPLogging.debug("Append type class for record ID : " +this.applicationID);
        typeClass = getTypeClassForRABoard(this.applicationID);
    }
    else
    {   
        typeClass = queryResult.typeClass;
    }
    ELPLogging.debug("typeClass to be appended : "+typeClass)
    var licenseNumber;
    //if (boardCode == "HD" )
    //{
        //var tmpLicenseNumber = queryResult.licenseNumber;
        //licenseNumber = Number(tmpLicenseNumber.substring(3,9));
    //}
    //else
    //{
        licenseNumber = Number(queryResult.licenseNumber);
    //}
    //var licenseNumber = Number(queryResult.licenseNumber);
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
LicenseData.prototype.retrieveLicenseData = function(capTypeAlias, applicationSubType) {
    ELPLogging.debug("Retrieve license data for capTypeAlias: " +capTypeAlias + " applicationSubType : " +applicationSubType);
    var licenseData = null;
    if (this.configurations != null)
    {
        licenseData = this.configurations[capTypeAlias];
        if (licenseData != null)
        {
            licenseData = licenseData[applicationSubType];
        }
    }
    return licenseData; 
}

/**
 * Retrieves the Application Types (group, type, subType, category) for the capId
 * @param capId - CAP ID for a Record
 * @returns applicationTypes - An Object consisting of
 *      group - B1_PER_GROUP
 *      type - B1_PER_TYPE
 *      subType - B1_PER_SUBTYPE
 *      category - B1_PER_CATEGORY
 */
LicenseData.prototype.getApplicationType = function(capId) {
    ELPLogging.debug("Retrieve application types for : " +capId);
    //Check for Record Type
    var applicationTypes = null;
    var capModelResult = aa.cap.getCap(capId);
    if (capModelResult.getSuccess()) 
    {
        var vCapModel = capModelResult.getOutput();     
        var vType = vCapModel.capType;
        vType = vType.toString();
        var ids = new Array();
        ids = vType.split("/");
        applicationTypes = {};
        applicationTypes.group = ids[0];
        ELPLogging.debug("vType --- " + vType);
        //applicationTypes.type = ids[1] + " " +ids[2];
        applicationTypes.type = ids[1];
        applicationTypes.subType = ids[2];
        applicationTypes.category = ids[3];
        applicationTypes.capTypeAlias = ids[1] + " " + ids[2];
        appTypeArray = ids;
    }
    return applicationTypes;
}

/**
 * Retrieves the Application Types (group, type, subType, category) for the capId
 * @param capId - CAP ID for a Record
 * @returns applicationTypes - An Object consisting of
 *      group - B1_PER_GROUP
 *      type - B1_PER_TYPE
 *      subType - B1_PER_SUBTYPE
 *      category - B1_PER_CATEGORY
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

/**
 * This function returns the Month (number) that determines whether the License period
 * begins on the previous year or the current year (based on the expiration month)
 * @param expirationMonth - Month this license type expires
 * @returns boundaryMonth - Month that determines which Year to start calculation of next
 * expiration date
 */
LicenseData.prototype.getExpirationMonthBoundary = function(expirationMonth) {
    if ((expirationMonth - 5) < 0) 
    {
        return (12 + expirationMonth - 5);      
    } 
    else 
    {
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
    if (capModelResult.getSuccess()) 
    {
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
    if ((licenseData.expirationMonth - 5) < 0) 
    {
        var monthBoundary = (12 + licenseData.expirationMonth - 5); 
        if (issueMonth == monthBoundary && (issueDate >= licenseData.expirationDay))
        {
            return true;
        }
        else if (issueMonth > monthBoundary || issueMonth < licenseData.expirationMonth) 
        {
            return true;
        } 
        else 
        {
            return false;
        }   
    } 
    else
    {
        var monthBoundary = (expirationMonth - 5);
        if (issueMonth == monthBoundary && (issueDate >= licenseData.expirationDay)) 
        {
            return true;            
        }
        else if (issueMonth > monthBoundary && issueMonth < licenseData.expirationMonth) 
        {
            return true;
        }
        else 
        {
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
    ELPLogging.debug("Setting license expiration date for record ID : " +capId);
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
 * This function issues a new license for a Intake Application (Exam)
 * Besides creating the License, it updates the Task Status of the Application to
 * Ready for Printing, and adds the License Id to the Print Set.
 * @param capId - CAP ID of application
 * @param queryResult -  information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.issueLicense = function(capId, queryResult) {
    ELPLogging.debug("Issue license for record ID : " +capId);
    
    updateAppStatus("Ready for Printing", "Updated via Script", capId);
    //As per flow work flow Intake and Exam should be deactivate
    deactivateWFTask("Intake", capId);
    deactivateWFTask("Exam", capId);
    
    // When work flow tasks Intake and Exam are deactivate then next step to activate work flow task to Issuance
    // When Application status is "Ready for Printing" then work flow task should be Issuance
    activateWFTask("Issuance", capId);
    
    var newLicId = this.createLicense(capId, queryResult);

    ELPLogging.debug("New License Object :" + newLicId);
    ELPLogging.debug("Custom ID :" + newLicId.getCustomID());
    var srcCapId = capId;

    if (newLicId != null)
    {
                ELPLogging.debug("Add to print set");  
        var fvShortNotes = getShortNotes(capId);
        updateShortNotes(fvShortNotes,newLicId);     
        setContactsSyncFlag("N", newLicId);

        reportName = queryResult.boardCode+"|LICENSE_REGISTRATION_CARD";
        
        var appCreatedBy = this.getCreatedBy(capId);

        if (appCreatedBy != null) 
        {
            editCreatedBy(appCreatedBy, newLicId);          
        }
        //Defect 11876
        updateAppStatus("Closed", "Updated via Script", capId);
        //Commented for Defect 7691
        if((queryResult.boardCode == "HD") && ((queryResult.typeClass == "1") || (queryResult.typeClass == "6")))       {
            callReport(reportName, false, true, "DPL License Print Set", capId);
                         ELPLogging.debug("Finished adding # "+ capId +" to print set");
        }
        
    }
    return newLicId;
}


/**
 * This function creates the License and returns the new License Id (CAP ID)
 * @param capId - CAP ID of Application
 * @param queryResult - information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.createLicense = function(lcapId, queryResult) {
    ELPLogging.debug("Creating license for record ID : " +lcapId);
    
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

    var types = this.getApplicationType(lcapId);
    //R-C Changes start
    if((queryResult.boardCode == "HD") && (queryResult.typeClass == "1"))
    {
        types.subType = "Type 1";
    }
    else if ((queryResult.boardCode == "HD") && (queryResult.typeClass == "2"))
    {
        types.subType = "Type 2";
    }
    else if((queryResult.boardCode == "HD") && (types.subType == "Out of State" || types.subType == "Out of Country"))
    {
        if(queryResult.typeClass == "1"){
            types.subType = "Type 1";
        }
        else if(queryResult.typeClass == "2"){
            types.subType = "Type 2";
        }
        else if(queryResult.typeClass == "3") {
            types.subType = "Type 3";
        }
        else if(queryResult.typeClass == "4") {
            types.subType = "Type 4";
        }
        else if(queryResult.typeClass == "6") {
            types.subType = "Type 6";
        }
        else if(queryResult.typeClass == "7") {
            types.subType = "Type 7";
        }
        else if(queryResult.typeClass == "8") {
            types.subType = "Type 8";
        }
        /*else if(queryResult.typeClass == "5") {
            types.subType = "Type 5";
        }*/
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass == "4"))
    {
        types.subType = "Type 4";
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass == "6"))
    {
        types.subType = "Type 6";
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass == "7"))
    {
        types.subType = "Type 7";
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass == "8"))
    {
        types.subType = "Type 8";
    }
    else if((queryResult.boardCode == "HD") && (queryResult.typeClass == "3"))
    {
        types.subType = "Type 3";
    }
    else if((queryResult.boardCode == "BR") && (types.subType == "Out of Country Apprentice")){
        types.subType = "Apprentice";
    }
    else if((queryResult.boardCode == "BR") && (queryResult.typeClass == "A") && (types.subType == "Lapsed")){
        types.subType = "Apprentice";
    }
    else if((queryResult.boardCode == "BR") && (queryResult.typeClass == "M") && (types.subType == "Lapsed")){
        types.subType = "Master";
    }
    //R-C Changes Ends
    
    //create the license record
    //unfortunately requires global capId
    ELPLogging.debug("Group : " + types.group + ", Type : " +types.type+ ", SubType : " +types.subType);
    capId = lcapId;
    this.applicationID = lcapId;
    ELPLogging.debug(" this.applicationID ---- " + this.applicationID + " lcapId --- " + lcapId);
    newLicId = createParent(types.group, types.type, types.subType, "License", null);
    if(!newLicId || newLicId == 'undefined')
    {
        ELPLogging.debug("License is not created for record# "+ lcapId);
        //If license is not created set the license id again as null;
        newLicId = null;
    }
    ELPLogging.debug("New License Id : " +newLicId);
    
    // Remove the ASI and Template tables from all contacts.
    removeContactTemplateFromContact(newLicId);

    //Fix for PROD Defect 7447 : Pearson Vue interface is using system date to set issue date for license. Should be using the issue date provided in the interface
    var sysDate = queryResult.licIssueDate;
    ELPLogging.debug("sysDate = "+sysDate);
    
    editLicIssueDate(newLicId);
    
    var sysDateMMDDYYYY = dateFormattedIntC(sysDate,"");
    ELPLogging.debug("sysDateMMDDYYYY " + sysDateMMDDYYYY);
    var rDate = new Date(sysDateMMDDYYYY);
    ELPLogging.debug("sysDateMMDDYYYY ", rDate);
    ELPLogging.debug("sysDateMMDDYYYY " + rDate.getTime());

    //Editing license issue date to sysDate in MMDDYYYY format
    editFirstIssuedDate(sysDateMMDDYYYY, newLicId);
    
    //Retrieve auto generated altID for new license
    oldAltID = newLicId.getCustomID();
    ELPLogging.debug("oldAltID : " +oldAltID);
    
    var asiTypeClass = queryResult.typeClass;
    var licenseNo = queryResult.licenseNumber;
    ELPLogging.debug("Board Code : " + boardCode);
    ELPLogging.debug("Type Class : " + asiTypeClass);
    ELPLogging.debug("License Number : " + licenseNo);

    var newAltID;
    if (changeTheAltIDFlag)
    {
        //change license Alt ID
        //Formatting altID to combination of licenseNumber+boardCode+typeClass that were retrieved in intake file
        newAltID = this.formatLicense(queryResult);
        ELPLogging.debug("New altID that were formed from intake file: " + newAltID);
    
        ELPLogging.debug("Updating new altID for : " +newLicId);
        var updateCapAltIDResult = aa.cap.updateCapAltID(newLicId, newAltID);
        
        if (updateCapAltIDResult.getSuccess())
        {
            ELPLogging.debug(newLicId + " AltID changed from " + oldAltID + " to " + newAltID);
        }
        else
        {
            ELPLogging.debug("*****WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
        }
    }
    else
    {
        newAltID = oldAltID;
    }
    
        
    // verify new altID associated with new licID
    capIdResult = aa.cap.getCapID(newAltID);
    
    if (!capIdResult.getSuccess()) 
    {
        var returnException = new ELPAccelaEMSEException("Cannot find CapID for : " + newAltID + " : " + capIdResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.debug(returnException.toString());
        throw returnException;
    }
    
    var returnedLicId = capIdResult.getOutput();
    ELPLogging.debug("returnedLicId : " +returnedLicId);
    
    if (!newLicId.equals(returnedLicId))
    {
        var returnException = new ELPAccelaEMSEException("Cap IDs for " + newAltID + " do not match: " + newLicId + " and " + returnedLicId, ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.debug(returnException.toString());
        throw returnException;
    } 
    else
    {
        newLicId = returnedLicId;
    }
    
    //Updating type class
    ELPLogging.debug("Updating type class : " +asiTypeClass+" for newLicId : " +newLicId);
    editAppSpecific("Type Class", asiTypeClass, newLicId);
    
    AltIDChanged = true;
    
    var newCapResult = aa.cap.getCap(newLicId);
    
    if (!newCapResult.getSuccess()) 
    {
        var returnException = new ELPAccelaEMSEException("Cannot find Cap for " + newLicId + ": " + capIdResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.debug(returnException.toString());
        throw returnException;
    }
    newCap = newCapResult.getOutput();
    ELPLogging.debug("AltID:" + newCap.capModel.altID);
    
    //Updating license status to "Current" as per the license record process flow
    ELPLogging.debug("Updating license status to Current starts");
    updateAppStatus(initStatus, "", newLicId);              //Need to check why its not updating status
    ELPLogging.debug("Updating license status to Current ends.");
    
    newLicIdString = newLicId.getCustomID();

    if (AltIDChanged) 
    {
        var newAltIDArray = newAltID.split("-");
        newLicIdString = newAltIDArray[0];
    }

    ELPLogging.debug("newLicIdString that is new altID :" + newLicIdString);
    
    //Adding license record to License Sync set
    ELPLogging.debug("Adding license record to License Sync set starts.");
    addToLicenseSyncSet(newLicId);  
    ELPLogging.debug("Adding license record to License Sync set ends.");
    if(queryResult.boardCode == "BR"){
        // Calculates the expiration date and sets it over the license
        var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
        var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
        
        var expiryDate = this.calculateDPLExpirationDate(queryResult, appConfigInfo, queryResult.licIssueDate);
        this.setLicExpirationDate(newLicId, expiryDate);
        var vExpDate = convertDateToScriptDateTime(expiryDate);
    }
    else {
        this.setLicExpirationDate(newLicId, queryResult.licExpiryDate);
        var vExpDate = convertDateToScriptDateTime(queryResult.licExpiryDate);
    }
    
    ELPLogging.debug("*****************  Creating Reference License Professional *****************");
    
    var licNumberArray = newAltID.split("-");
    var licenseNumber = licNumberArray[0];
    var boardName = licNumberArray[1];
    var licenseType = licNumberArray[2];
    
    createRefLicProf(licenseNumber, boardName, licenseType, contactType, initStatus, vExpDate);
    
    ELPLogging.debug("*****************  Created Reference License Professional  *****************");
    
    ELPLogging.debug("***************** Getting Reference License Professional starts *****************");
    
    newLic = getRefLicenseProf(licenseNumber, boardName, licenseType);
    ELPLogging.debug("New reference license professional : " +newLic);
    
    ELPLogging.debug("***************** Getting Reference License Professional Ends *****************");
    
    if (newLic)
    {
        //Fix for PROD Defect 7447
        if(queryResult.licIssueDate!=null)
        {
            ELPLogging.debug("Updating the license issue date on LP from intake file.");
            updateLicenseIssueDateOnLP(licenseNumber, boardName, licenseType, newLic, queryResult);
        }
        
        ELPLogging.debug("Reference LP successfully created");
        associateLpWithCap(newLic, newLicId);
    }
    else 
    {
        ELPLogging.debug("Reference LP not created");
    }
    
     /* JIRA 2356 - Start: updated license issue and expiration date on b3contra table */
    licExpirationDate = vExpDate;
    licenseProfessional = getLicenseProfessional(newLicId);
    
    if(queryResult.licIssueDate!=null)
    {
        sysDate = queryResult.licIssueDate;
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
    /* JIRA 2356 - End: updated license issue and expiration date on b3contra table */
    
    conToChange = null;
    cons = aa.people.getCapContactByCapID(newLicId).getOutput();
    ELPLogging.debug("Contacts : " +cons);
    ELPLogging.debug("Contact Length : " +cons.length);

    for (thisCon in cons)
    {
        ELPLogging.debug("Contact Type is : " +cons[thisCon].getCapContactModel().getPeople().getContactType());
        if (cons[thisCon].getCapContactModel().getPeople().getContactType() == contactType)
        {
            conToChange = cons[thisCon].getCapContactModel();
            p = conToChange.getPeople();
            p.setContactType(licHolderType);
            conToChange.setPeople(p);
            aa.people.editCapContact(conToChange);
            
            ELPLogging.debug("Contact type successfully switched to = " + licHolderType);

            //added by the to copy contact-Address
            var source = getPeople(lcapId);
            for (zz in source)
            {
                sourcePeopleModel = source[zz].getCapContactModel();
                ELPLogging.debug("sourcePeopleModel contact type = " +sourcePeopleModel.getPeople().getContactType());
                
                if (sourcePeopleModel.getPeople().getContactType() == contactType) 
                {
                    ELPLogging.debug("source ppl contact sequence nbr =  " +sourcePeopleModel.getPeople().getContactSeqNumber());
                    ELPLogging.debug("ContactAddressList : " +sourcePeopleModel.getPeople().getContactAddressList());
                    p.setContactAddressList(sourcePeopleModel.getPeople().getContactAddressList());
                    aa.people.editCapContactWithAttribute(conToChange);
                    ELPLogging.debug("ContactAddress Updated Successfully");
                }
            }
        }
    }
    ELPLogging.debug("Final newLicId : " +newLicId);
    return newLicId;
}

LicenseData.prototype.checkLicenseNumber = function(queryResult, capId) {
    this.applicationID = capId;
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
 * This function validates the expiration date
 * @param capId - CAP ID of Application
 * @param queryResult - data
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validateExpirationDate = function(queryResult, appConfigInfo) {
    ELPLogging.debug("Validating license expiration date." );
    if (queryResult.licIssueDate == null || queryResult.licExpiryDate == null) 
    {
        return false;
    }
    var issueDateObj = queryResult.licIssueDate;
    var inputExpDate = queryResult.licExpiryDate;
    
    var expDate = this.calculateDPLExpirationDate(queryResult, appConfigInfo, issueDateObj);
    
    var inputExpDateS = dateFormattedIntC(inputExpDate, "MMDDYYYY");
    var expDateS = dateFormattedIntC(expDate, "MMDDYYYY");
    ELPLogging.debug("Expiration Date:        " + inputExpDateS);
    ELPLogging.debug("Calculated Expiration Date: " + expDateS);
    if (inputExpDateS == expDateS) 
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * This function validates the License Number
 * If valid, it increments the value in the configurations
 * @param capId - CAP ID of Application
 * @param queryResult - data
 * @returns boolean - true if number is valie, false if number is not valid
 */
LicenseData.prototype.validateLicenseNumber = function(queryResult, appConfigInfo) {
    var types = this.getApplicationTypeForAppRecord(appConfigInfo);
    
    ELPLogging.debug("queryResult.typeClass # "+queryResult.typeClass);
    if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "2"))
    {
        if(queryResult.shouldAppCreate)
        {
            ELPLogging.debug("--1--");
            types.capTypeAlias = "Cosmetology Type 2";
        }
        else
        {
            ELPLogging.debug("--2--");
            types.capTypeAlias = "Cosmetology Type 1";
        }
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "7"))
    {
        types.capTypeAlias = "Cosmetology Type 7";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "3"))
    {
        types.capTypeAlias = "Cosmetology Type 3";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass == "4"))
    {
        types.capTypeAlias = "Cosmetology Type 4";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="8"))
    {
        types.capTypeAlias = "Cosmetology Type 8";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="1"))
    {
        types.capTypeAlias = "Cosmetology Type 1";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="6"))
    {
        types.capTypeAlias = "Cosmetology Type 6";
    }
    else if((queryResult.boardCode == "HD" ) && (queryResult.typeClass =="5"))
    {
        types.capTypeAlias = "Cosmetology Type 5";
    }
    
    ELPLogging.debug("types.capTypeAlias : "+types.capTypeAlias);
    var lastSequenceNbr = this.configurations[types.capTypeAlias].lastSequenceNbr;
    
    ELPLogging.debug("Last sequence number : " + lastSequenceNbr);

    var inputLicNo;
    if (queryResult.boardCode == "HD" )
    {
        var tmpLicenseNumber = queryResult.licenseNumber;
        inputLicNo = Number(tmpLicenseNumber.substring(3,9));
    }
    else
    {
        inputLicNo = Number(queryResult.licenseNumber);
    }
    
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
                if(queryResult.boardCode == "RE" || queryResult.boardCode == "BR")
                {
                    //Fix for PROD Defect 7497 : Pearson Vuew error log entries have no way to map to source file
                    if((queryResult.firstName != null) && (queryResult.lastName != null))
                    {
                        recordID = queryResult.firstName+ " " +queryResult.lastName;
                    }
                    else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
                    {
                        recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
                    }
                    else
                    {
                        recordID = "Formating Issue.";
                    }
                    
                }
                else if((queryResult.boardCode == "RA") || (queryResult.boardCode == "HD" ) || (queryResult.typeClass == "1") || (queryResult.typeClass == "6"))
                {
                    if(queryResult.recordID != null)
                    {
                        recordID = queryResult.recordID;
                    }
                    else if((queryResult.firstName != null) && (queryResult.lastName != null))
                    {
                        recordID = queryResult.firstName+ " " +queryResult.lastName;
                    }
                    else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
                    {
                        recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
                    }
                    else
                    {
                        recordID = "Formating Issue."
                    }
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
 * This function converts a JS Date to a Accela ScriptDateTime
 * @param jsDate - JS Date
 * @returns accelaDate - ScriptDateTime
 */
function convertDateToScriptDateTime(jsDate) {
    ELPLogging.debug("Converting date to script date time.");
    var utilDate = convertDateToJavaDate(jsDate);
    var accelaDate = aa.date.getScriptDateTime(utilDate);   
    ELPLogging.debug("accelaDate : " +accelaDate);
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
LicenseData.prototype.incrementLastSequenceNbr = function(capTypeAlias) {
    ELPLogging.debug("Incrementing last sequence number.");
    var lc = this.configurations[capTypeAlias];
    if (lc != null && lc.lastSequenceNbr != null)
    {
        lc.lastSequenceNbr++;
        ELPLogging.debug("Incremented " + capTypeAlias);
    }
}

/**
 * This function updates the LICENSE_SEQUENCE_NUMBER standard choice with the values
 * in configurations
 * @param void
 * @returns void
 */
LicenseData.prototype.updateLicenseSequenceNumbers = function() {
    ELPLogging.debug("Updating license sequence number.");
    var lcs = this.configurations;
    for (var type in lcs) 
    {
        var lc = lcs[type];
        var stdDesc = lc.lastSequenceNbr.toString();
        updateStandardChoice("LICENSE_SEQUENCE_NUMBER",type,stdDesc);
    }
}


function updateStandardChoice(stdChoice,stdValue,stdDesc) 
{
    //check if stdChoice and stdValue already exist; if they do, update;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(String(stdChoice),String(stdValue));
    if (bizDomScriptResult.getSuccess()) 
    {
        bds = bizDomScriptResult.getOutput();
    } 
    else 
    {
        ELPLogging.debug("Std Choice(" + stdChoice + "," + stdValue + ") does not exist to edit, adding...");
        return addStandardChoice(stdChoice,stdValue,stdDesc);
    }
    var bd = bds.getBizDomain()
    
    bd.setDescription(String(stdDesc));
    var editResult = aa.bizDomain.editBizDomain(bd)

    if (editResult.getSuccess())
    {
        ELPLogging.debug("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
        return true;
    }
    else
    {
        ELPLogging.debug("**ERROR editing Std Choice " + editResult.getErrorMessage());
        return false;
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
    for (i in wfObj)
    {
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
    ELPLogging.debug("Activation WFTASK : " +wfstr+ " for capID : " +capId);
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        return false;
    }
    var procId = wfObj[0].getProcessID();   
    for (i in wfObj) 
    {
        var fTask = wfObj[i];
        ELPLogging.debug("Activation WFTASK = fTask of : " +fTask.getTaskDescription());
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) 
        {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();
            aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null);
            // Assign the user
            var taskUserObj = fTask.getTaskItem().getAssignedUser();
            //taskUserObj.setDeptOfUser("DPL/DPL/LIC/EDP/STAFF/NA/NA");

            //fTask.setAssignedUser(taskUserObj);
            var taskItem = fTask.getTaskItem();

            var adjustResult = aa.workflow.assignTask(taskItem);
            if (adjustResult.getSuccess())
            {
                ELPLogging.debug("Updated Work flow Task : " + wfstr);
            }
            else
            {
                ELPLogging.debug("Error updating wfTask : " + adjustResult.getErrorMessage());
            }         
            
            ELPLogging.debug("Activating Work flow Task: " + wfstr.toUpperCase());
            ELPLogging.debug("Activating Work flow Task: " + wfstr.toUpperCase());
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
        //If SSN did not matches regular expression value then set conditionFlag to true
        if(socSecNumber.match(/^(?!\b(\d)\1+\b)(?!123456789|219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/))
        {
            ELPLogging.debug("Pattern did not matched Matched. Don't add condition.");
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
        ELPLogging.debug("Invalid SSN. SSN contains alpha numeric characters.")
        SSNValidationArray.validationFlag = false;
        SSNValidationArray.conditionFlag = false;
    }   
    
    return SSNValidationArray;
}

/**
 * @desc This method is performing validation for phone number.
 * @param {primaryPhone} contains phone number from staging table.
 * @returns {boolean} - Contains boolean value
 */
function validatePhoneNumber(primaryPhone) 
{
    ELPLogging.debug("Performing validation for phone number : " +primaryPhone);
    if(primaryPhone != null)
    {
        var scanner = new Scanner(primaryPhone,"-");
        var formattedPhNumber = scanner.next()+scanner.next()+scanner.next();
        
        if(!isNaN(formattedPhNumber))
        {
            return true;
        }
        else 
        {
            ELPLogging.debug("Invalid phone number.");
            return false;
        }
    }
    else
    {
        return true;
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
 * @desc This method creates contact address for the record.
 * @param {capIDModel} - contains the record ID.
 * @param {contactSeqNumber} - contains the contact sequence number for the contact the Address will be added to.
 * @param {contactAddressDetailsArray} contains contact Address Details Array from staging table.
 * @throws ELPAccelaEMSEException
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
    
    // Defect : 4269
    var zipCode=null;
    if(contactAddressDetailsArray.zipCodeB != null)
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
 * @desc This method creates an premise address for the record.
 * @param {capIdModel} capIDModel - contains the record id from Accela system.
 * @param {queryResult} contains query result from staging table.
 * @throws ELPAccelaEMSEException
 */
function createPremiseAddress(capIDModel, queryResult)
{
    ELPLogging.debug("Creating premise address for record ID : " +capIDModel);
        
    var addressModel = new com.accela.aa.aamain.address.AddressModel();
    
    addressModel.setHouseNumberAlphaStart(queryResult.busBuildingNum);
    addressModel.setAddressLine1(queryResult.busAddressLine1);
    addressModel.setAddressLine2(queryResult.busAddressLine2);
    addressModel.setCity(queryResult.busCity);
    addressModel.setState(queryResult.busState);
    addressModel.setZip(queryResult.busZipA);
    addressModel.setPrimaryFlag("Y");
    addressModel.setServiceProviderCode(queryResult.serviceProviderCode);
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
* @desc: This method creates a set on a monthly basis for each board in a exam vendor file.
*        If the set already exists for the month it should not create a new one and simply return the existing set name     
* @param: {String} boardCode - contains the board code.
* @param: {String} vendor - contains the vendor name.
*/
function getMonthlyPaymentSet(boardCode, vendor)
{
    ELPLogging.debug("Creating monthly payment set.");
    var pJavaScriptDate = new Date();
    
    month = pJavaScriptDate.getMonth();
    
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
 * @desc This method add standard condition on reference contact. 
 * @param {conditionType} contains condition type
 * @param {conditionDesc} contains condition description
 * @param {capID} contains the record ID
 * @throws N/A
 */ 
function addContactStdConditionOnRefContact(conditionType, conditionDesc, comment, capId) 
{
    ELPLogging.debug("Add condition on reference contact.");
    var addContactConditionResult = null;
    var foundCondition = false;
    var javascriptDate = new Date()
    var javautilDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());
    cStatus = "Applied";

    if (arguments.length > 3)
    cStatus = arguments[3]; // use condition status in args
    
    if (!aa.capCondition.getStandardConditions) 
    {
        ELPLogging.debug("addAddressStdCondition function is not available in this version of Accela Automation.");
    }
    else
    {
        standardConditions = aa.capCondition.getStandardConditions(conditionType, conditionDesc).getOutput();

        for (index = 0; index < standardConditions.length; index++)
        {
          if (standardConditions[index].getConditionType().toUpperCase() == conditionType.toUpperCase() 
                && standardConditions[index].getConditionDesc().toUpperCase() == conditionDesc.toUpperCase())
          {
            standardCondition = standardConditions[index]; // add the last one found
            ELPLogging.debug("cComment = " +standardCondition.getConditionComment());
            foundCondition = true;
            
              var capContactResult = aa.people.getCapContactByCapID(capId);
              if (capContactResult.getSuccess()) 
              {
                var Contacts = capContactResult.getOutput();
                for (var contactIdx in Contacts)
                {
                  var refContactNumber = Contacts[contactIdx].getCapContactModel().refContactNumber;
                  if (refContactNumber)
                  {
                    var conditionComment = standardCondition.getConditionComment() + " with License# : " + refContactNumber + ", "+ comment;
                    var newCondition = aa.commonCondition.getNewCommonConditionModel().getOutput();
                    newCondition.setServiceProviderCode(aa.getServiceProviderCode());
                    newCondition.setEntityType("CONTACT");
                    newCondition.setEntityID(refContactNumber);
                    newCondition.setConditionDescription(standardCondition.getConditionDesc());
                    newCondition.setConditionGroup(standardCondition.getConditionGroup());
                    newCondition.setConditionType(standardCondition.getConditionType());
                    newCondition.setConditionComment(conditionComment);
                    newCondition.setImpactCode(standardCondition.getImpactCode());
                    newCondition.setConditionStatus(cStatus)
                    newCondition.setAuditStatus("A");
                    newCondition.setIssuedByUser(systemUserObj);
                    newCondition.setIssuedDate(javautilDate);
                    newCondition.setEffectDate(javautilDate);
                    newCondition.setAuditID(currentUserID);

                    var addContactConditionResult = aa.commonCondition.addCommonCondition(newCondition);
                    if (addContactConditionResult.getSuccess())
                    {
                      ELPLogging.debug("Successfully added reference contact (" + refContactNumber + ") condition: " + conditionDesc);
                    }
                    else 
                    {
                      ELPLogging.debug("**ERROR: adding reference contact (" + refContactNumber + ") condition: " + addContactConditionResult.getErrorMessage());
                    }
                  }
                  else
                  {
                    ELPLogging.debug("No contact sequence number associated with the record.");
                  }
                }
              }
          }
        }
    }
    
    if (!foundCondition)
    {
        ELPLogging.debug("**WARNING: couldn't find standard condition for " + conditionType + " / " + conditionDesc);
    }
  return addContactConditionResult;
}

/** 
 * @desc This method will add and update condition on the reference license
 * @param {licSeqNbr} contains a license sequence number
 * @param {conditionType} contains the condition type "ELP Interfaces"
 * @param {conditionName} contains the condition name "Renewal stayed by DUA"
 * @param {conditionComment} contains the condition comment "Non-compliant with DUA on <First time non compliant Run Date>,
 * Non-compliant again on <Run Date>"
 * @param {runDate} contains the runDate from the dynamic parameters
 * @throws  N/A
 */ 
function addUpdateCondOnRefLicForResendRecord(licSeqNbr, conditionType, conditionName, conditionComment)
{
    ELPLogging.debug("Add update condition on reference license for licSeqNbr : " +licSeqNbr);
    
    //Retrieve the conditions on the reference license
    var conditionList = aa.caeCondition.getCAEConditions(licSeqNbr);

    //This boolean variable is used to check the condition exists on the reference license or not
    var condExistFlag = false;
    
    if (conditionList.getSuccess())
    {
        var conditionModel = conditionList.getOutput();
        
        if (conditionModel)
        {
            for (index in conditionModel)
            {
                var condition = conditionModel[index];
                
                //Check if the condition type and condition name both exists on the reference license
                if ((condition.getConditionType() == conditionType) && (condition.getConditionDescription() == conditionName))
                {
                    //Condition details object
                    var toEditCapCondition = condition;
                    
                    //if condition exists then set condExistFlag to true
                    condExistFlag = true;
                    break;  
                }
    
            }
        }
        
        //If condition already exists on the reference license then update the comment
        if(condExistFlag)
        {
            ELPLogging.debug("Editing condition on license number : " + licSeqNbr);

            //Merging the condition comment
            //conditionComment = conditionComment+runDate;

            //Setting the updated conditionComment
            condition.setConditionComment(conditionComment);
            
            //Editing the condition condition comment on the reference license
            var editCaeCondResult = aa.caeCondition.editCAECondition(condition);
            
            //Logging the message in the log file if the conditionComment has been successfully updated 
            if(editCaeCondResult.getSuccess())
            {
                ELPLogging.debug("Successfully edited condition comment : "+ condition.getConditionComment());
            }
            else
            {
                //Logging message if there is any exception occurs while updating the conditionComment
                var errorMessage = "Error editing condition on reference license : " +toEditCapCondition.getConditionDescription()+" : "+editCaeCondResult.getErrorMessage();
                ELPLogging.debug(errorMessage);

                //Throwing an exception if there is any exception occurs while updating the conditionComment
                returnException = new ELPAccelaEMSEException(errorMessage, ScriptReturnCodes.EMSE_PROCEDURE);
                ELPLogging.notify(returnException.toString());
                throw returnException;
            }
        }
        else
        {
            ELPLogging.debug("Add a new condition on the license sequence number : " +licSeqNbr);
                
            //conditionComment = conditionComment + runDate;
            ELPLogging.debug("New condition with condition comment : " +conditionComment);
            
            //Adding new condition on the reference license
            var addCaeCondResult = aa.caeCondition.addCAECondition(licSeqNbr, conditionType, conditionName, conditionComment, null, null, null, null, null, null, null, null, null, null);
            
            //Logging the message in the log file if the condition added successfully
            if(addCaeCondResult.getSuccess())
            {
                ELPLogging.debug("Successfully Added condition "+conditionName);
            }
            else
            {
                //Logging the message if there is any exception occurs while adding the CAE condition
                var errorMessage = "Error adding condition on reference license : " +  conditionName+" : "+addCaeCondResult.getErrorMessage();
                ELPLogging.debug(errorMessage);

                //Throwing an exception if there is any exception occurs while updating the conditionComment
                returnException = new ELPAccelaEMSEException(errorMessage, ScriptReturnCodes.EMSE_PROCEDURE);
                ELPLogging.notify(returnException.toString());
                throw returnException;
            }                       
        }
    }
}

/**
 * @desc This method returns the type class value based on the application type.
 * @param {capId} capId - contains record ID.
 */
function getTypeClassForRABoard(capId)
{
    ELPLogging.debug("Retrieving typeClass details for RA board Application : " +capId);
    var typeClass = "";
    var asiDetailResult = aa.appSpecificInfo.getByCapID(capId); 

    if(asiDetailResult.getSuccess())
    {
        var asiDetailsModel = asiDetailResult.getOutput();
        if(asiDetailsModel)
        {
            for(ASI in asiDetailsModel)
            {
                if(asiDetailsModel[ASI].getFieldLabel() == "Please select application type")
                {
                    var checklistComment = asiDetailsModel[ASI].getChecklistComment();
                    
                    if(checklistComment == "State-Certified General Real Estate Appraiser")
                    {
                        typeClass = "CG";
                    }
                    else if(checklistComment == "State-Certified Residential Real Estate Appraiser")
                    {
                        typeClass = "CR";
                    }
                    else if(checklistComment == "State-Licensed Real Estate Appraiser")
                    {
                        typeClass = "LA";
                    }
                    ELPLogging.debug("Type class of RA board : " +typeClass);
                }
            }
        }   
    }
    return typeClass;
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
    
    var vIssueDate = convertDateToScriptDateTime(licenseIssueDate);
    
    newLic.setLicOrigIssDate(vIssueDate);
    newLic.setLicenseIssueDate(vIssueDate);
        
    myResult = aa.licenseScript.editRefLicenseProf(newLic);
    
    if (myResult.getSuccess()) {
        ELPLogging.debug("Successfully updated License Issue Date. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
        
    } else {
        ELPLogging.debug("**ERROR: can't update the License Issue Date: " + myResult.getErrorMessage());
    }
    
}

/**
 * @desc This method will update license file Date and reported date
 * @param {capIDModel} capIDModel - license record ID
 */

function editLicIssueDate(capIDModel)
{
    ELPLogging.debug("Update license file DD to license issue date from intake file for record ID = "+capIDModel);
    
    var capResult = aa.cap.getCap(capIDModel);
    var capScriptModel = capResult.getOutput();
    
    if (capScriptModel)
    {
        //set values for CAP record
        var capModel = capScriptModel.getCapModel();
        capModel.setReportedDate(new java.util.Date(queryResult.licIssueDate));
        capModel.setFileDate(new java.util.Date(queryResult.licIssueDate));
        
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