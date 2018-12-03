/**
 * @file - EMSE_MA_INT_PCS_LICENSE:
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

function dateFormattedIntC(dateObj, pFormat) {
	var mth = "";
	var day = "";
	var ret = "";
	if (dateObj == null) {
		return "";
	}
	if (dateObj.getMonth() >= 9) {
		mth = "" + (dateObj.getMonth() + 1);
	} else {
		mth = "0" + (dateObj.getMonth() + 1);
	}
	if (dateObj.getDate() > 9) {
		day = dateObj.getDate().toString();
	} else {
		day = "0" + dateObj.getDate().toString();
	}
	if (pFormat == "YYYY-MM-DD") {
		ret = dateObj.getFullYear().toString() + "-" + mth + "-" + day;
	} else if (pFormat == "MMDDYYYY") {
		ret = "" + mth + day + dateObj.getFullYear().toString();
	} else if (pFormat == "YYYYMMDD") {
		ret = "" + dateObj.getFullYear().toString() + mth + day;
	} else {
		ret = "" + mth + "/" + day + "/" + dateObj.getFullYear().toString();
	}

	return ret;
}

/**
 * These are symbolic constants for the expiration codes in b1_expiration.
 */
var LICENSE_EXPIRATION_CODES = {
	FEB28_1YR: "FEB 28 1YR",
	BIRTH28_2YR: "28TH BIRTH MONTH 2YR",
	DEC31_1YR: "DEC 31 1YR",
	ISSUE_2YR: "ISSUE DATE 2YR",
	JULY31_3YR: "31ST JULY 3YR",
	MAY01_EVENYR: "MAY 01 EVENYR",
	JUNE30_EVENYR: "30 JUN EVEN YEAR",
	OCTOBER_31ST: "OCTOBER 31ST",
	MARCH_31_ANNUAL: "MAR-31-ANNUAL",
	BIRTHDAY_BIENNIAL: "BIRTHDAY BIENNIAL",
	BIRTHDATE_2YR: "BIRTHDATE 2YR",
	JAN_31_ANNUAL: "31JAN/ANNUAL"
};

/**
 * This Object (Class) encapsulates the License configuration information and actions for
 * validating and issuing licenses for PCS exam applications/renewals.
 */
function LicenseData(parameters) {
	this.dbConnection = null;
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
	"connectionInfoSC": "DB_CONNECTION_INFO",
	"supplemental": [{
		"tag": "licenseConfiguration",
		"procedure": {
			"name": "ELP_SP_LICENSE_CONFIG",
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
	}, {
		"tag": "licenseConfigurationDPL",
		"procedure": {
			"name": "ELP_SP_LICENSE_CONFIG_DPL",
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
	}, {
		"tag": "ELP_VW_LICENSE_CONFIG",
		"procedure": {
			"name": "ELP_VW_LICENSE_CONFIG",
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
			},
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
					"name": "expirationCode",
					"parameterType": "IN",
					"property": "expirationCode",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "description",
					"parameterType": "IN",
					"property": "description",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "expirationInterval",
					"parameterType": "IN",
					"property": "expirationInterval",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "expirationUnits",
					"parameterType": "IN",
					"property": "expirationUnits",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "expirationMonth",
					"parameterType": "IN",
					"property": "expirationMonth",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "expirationDay",
					"parameterType": "IN",
					"property": "expirationDay",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "maskPattern",
					"parameterType": "IN",
					"property": "maskPattern",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "lastSequenceNbr",
					"parameterType": "IN",
					"property": "lastSequenceNbr",
					"type": "INTEGER"
				}]
			}
		}
	}, {
		"tag": "ELP_VW_LICENSE_CONFIG_DPL",
		"procedure": {
			"name": "ELP_VW_LICENSE_CONFIG_DPL",
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
			},
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
					"name": "expirationCode",
					"parameterType": "IN",
					"property": "expirationCode",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "description",
					"parameterType": "IN",
					"property": "description",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "expirationInterval",
					"parameterType": "IN",
					"property": "expirationInterval",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "expirationUnits",
					"parameterType": "IN",
					"property": "expirationUnits",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "expirationMonth",
					"parameterType": "IN",
					"property": "expirationMonth",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "expirationDay",
					"parameterType": "IN",
					"property": "expirationDay",
					"type": "INTEGER"
				}, {
					"source": "RESULT",
					"name": "maskPattern",
					"parameterType": "IN",
					"property": "maskPattern",
					"type": "STRING"
				}, {
					"source": "RESULT",
					"name": "lastSequenceNbr",
					"parameterType": "IN",
					"property": "lastSequenceNbr",
					"type": "INTEGER"
				}]
			}
		}
	}]
};


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
	this.dbConnection = null;
	var returnException;
	try {
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
		for (var ii = 0; ii < this.procedureConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = this.procedureConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "licenseConfigurationDPL") {
				var getLicenseConfigurationProcedure = new StoredProcedure(supplementalConfiguration.procedure, this.dbConnection);
				break;
			}
		}

		if (getLicenseConfigurationProcedure == null) {
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
		// var inputParameters = getLicenseConfigurationProcedure.prepareParameters(null, null, parameters);
		// ELPLogging.debug("     InputParameters for getLicenseConfigurationProcedure:", inputParameters);
		// getLicenseConfigurationProcedure.setParameters(inputParameters);
		// var dataSet = getLicenseConfigurationProcedure.queryProcedure();
		ELPLogging.debug("*** Finished getLicenseConfigurationRecords() ***");
		// loop through all license configuration records
		var licenseConfiguration = null;
		var configurations = {};
		while ((licenseConfiguration = dataSet.next()) != null) {
			if (configurations[licenseConfiguration.applicationType] != null) {
				var lc = configurations[licenseConfiguration.applicationType];
				lc[licenseConfiguration.applicationSubType] = licenseConfiguration;
				if (licenseConfiguration.lastSequenceNbr != null) {
					ELPLogging.debug("CONFIG - Has applicationType", licenseConfiguration);
					lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
				}
			} else {
				configurations[licenseConfiguration.applicationType] = {};
				var lc = configurations[licenseConfiguration.applicationType];
				lc[licenseConfiguration.applicationSubType] = licenseConfiguration;
				if (licenseConfiguration.lastSequenceNbr != null) {
					ELPLogging.debug("CONFIG - No applicationType", licenseConfiguration);
					lc.lastSequenceNbr = licenseConfiguration.lastSequenceNbr;
				}
			}
		}
	} finally {
		if (this.dbConnection != null) {
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

	var applicationTypeandSubType = applicationType.type + " " + applicationType.subType;

	if (applicationType.type == "Sheet Metal" && applicationType.subType == "Apprentice") {
		applicationTypeandSubType = "Sheet Metal Master";
	}


	var licenseData = this.retrieveLicenseData(applicationTypeandSubType, applicationType.subType);
	var expirationCode = String(licenseData.expirationCode);
	ELPLogging.debug("expirationCode : - " + expirationCode);
	switch (expirationCode) {
		case LICENSE_EXPIRATION_CODES.FEB28_1YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.FEB28_1YR);
			if (issueDateObj != null) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);

				if (!this.withinExpirationBoundary(issueDateObj, licenseData)) {
					expDate.setDate(1);
					expDate.setFullYear((issueDateYear + 1));
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
			if ((issueDateObj != null) && (bDateObj != null)) {
				var issueDateYear = issueDateObj.getFullYear();
				if (bDateObj.getMonth() > issueDateObj.getMonth()) {
					expDate.setDate(1);
					expDate.setFullYear((issueDateYear - 1));
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
			if (issueDateObj) {
				if ((applicationType.subType == "Sanitarian") || (applicationType.subType == "Podiatrist")) {
					//Process the exp logic for Sanitarian here
					// Issue date artifacts
					var issueDateYear = issueDateObj.getFullYear();
					var month = licenseData.expirationMonth - 1;
					var date = licenseData.expirationDay;

					// Date range start date
					var baseLineDate = new Date();
					baseLineDate.setMonth(8, 1);
					baseLineDate.setFullYear(issueDateYear);

					expDate.setMonth(month, date);
					if (issueDateObj < baseLineDate) {
						//set the expiration date of the license to 01/31 of the current year
						expDate.setFullYear(issueDateYear - 1);
					} else {
						//set the expiration date of the license to 01/31 of next year
						expDate.setFullYear(issueDateYear);
					}
				} else {
					var issueMonth = issueDateObj.getMonth();
					var issueDate = issueDateObj.getDate();
					var issueDateYear = issueDateObj.getFullYear();
					//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);

					if (!this.withinExpirationBoundary(issueDateObj, licenseData)) {
						expDate.setDate(1);
						expDate.setFullYear((issueDateYear + 1));
						expDate.setMonth(licenseData.expirationMonth - 1);
						expDate.setDate(licenseData.expirationDay);
					} else {
						expDate.setDate(1);
						expDate.setFullYear(issueDateYear);
						expDate.setMonth(licenseData.expirationMonth - 1);
						expDate.setDate(licenseData.expirationDay);
					}
				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.JULY31_3YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.JULY31_3YR);
			if (issueDateObj) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);

				if (!this.withinExpirationBoundary(issueDateObj, licenseData)) {
					expDate.setDate(1);
					expDate.setFullYear((issueDateYear));
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);
				} else {
					expDate.setDate(1);
					expDate.setFullYear(issueDateYear - 1);
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);
				}

			}
			break;
		case LICENSE_EXPIRATION_CODES.ISSUE_2YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.ISSUE_2YR);
			if (issueDateObj) {
				var issueMonth = issueDateObj.getMonth();
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();
				//ELPLogging.debug("issueMonth: " + issueMonth + " issueDate: " + issueDate);
				expDate = issueDateObj;

			}
			break;
		case LICENSE_EXPIRATION_CODES.MAY01_EVENYR:
			{
				ELPLogging.debug(LICENSE_EXPIRATION_CODES.MAY01_EVENYR);
				if (issueDateObj) {
					var issueMonth = issueDateObj.getMonth();
					var issueDate = issueDateObj.getDate();
					var issueDateYear = issueDateObj.getFullYear();
					ELPLogging.debug("issueDateObj : " + issueDateObj + ", expDate : " + expDate + " licenseData : " + licenseData);
					if (this.withinExpirationBoundary(issueDateObj, licenseData)) {
						ELPLogging.debug("within the boundary conditions");
						if (issueDateObj.getFullYear() % 2 == 0) {
							expDate.setFullYear((issueDateYear - 2));
						} else {
							expDate.setFullYear((issueDateYear - 1));
						}
						expDate.setMonth(licenseData.expirationMonth - 1);
						expDate.setDate(licenseData.expirationDay);
						ELPLogging.debug("expMonth : " + licenseData.expirationMonth + "expDay : " + licenseData.expirationDay);
					} else {
						if (issueDateObj.getFullYear() % 2 == 0) {
							expDate.setFullYear(issueDateYear);
						} else {
							expDate.setFullYear(issueDateYear + 1);
						}
						expDate.setDate(1);
						expDate.setMonth(licenseData.expirationMonth - 1);
						expDate.setDate(licenseData.expirationDay);
						ELPLogging.debug("expMonth : " + licenseData.expirationMonth + "expDay : " + licenseData.expirationDay);
					}

					ELPLogging.debug("expDate : -- " + expDate);
				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.JUNE30_EVENYR:
			{
				ELPLogging.debug("LICENSE_EXPIRATION_CODES.JUNE30_EVENYR: " + LICENSE_EXPIRATION_CODES.JUNE30_EVENYR);
				if (issueDateObj) {
					var issueMonth = issueDateObj.getMonth();
					var issueDate = issueDateObj.getDate();
					var issueDateYear = issueDateObj.getFullYear();
					ELPLogging.debug("issueDateObj : " + issueDateObj + ", expDate : " + expDate + " licenseData : " + licenseData);
					//if (this.withinExpirationBoundary(issueDateObj, licenseData)) {
					//ELPLogging.debug("within the boundary conditions");
					// Defect #8657: 
					if (expDate.getDate() == 31) {
						ELPLogging.debug("Date Triggered");
						expDate.setDate(30);
					}
					if (issueDateObj.getFullYear() % 2 == 0) {
						expDate.setFullYear((issueDateYear));
					} else {
						expDate.setFullYear((issueDateYear - 1));
					}
					expDate.setMonth(licenseData.expirationMonth - 1);
					expDate.setDate(licenseData.expirationDay);
					ELPLogging.debug("expMonth : " + licenseData.expirationMonth + "expDay : " + licenseData.expirationDay);
					ELPLogging.debug("expDate : -- " + expDate);
				}
			}
			break;
		default:
			ELPLogging.debug("DEFAULT " + licenseData.expirationCode);
			break;
	}

	ELPLogging.debug("Expiration date to pass: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());
	if (licenseData.expirationUnits == null) {
		var returnException = new ELPAccelaEMSEException("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.debug(returnException.toString());
		throw returnException;
	}

	if (licenseData.expirationUnits == "Days") {
		expDate.setDate(expDate.getDate + licenseData.expirationInterval);
	}

	if (licenseData.expirationUnits == "Months") {
		var day = expDate.getDate();
		expDate.setMonth(expDate.getMonth() + pMonths);
		if (expDate.getDate() < day) {
			expDate.setDate(1);
			expDate.setDate(expDate.getDate() - 1);
		}
	}

	if (licenseData.expirationUnits == "Years") {
		var day = expDate.getDate();
		expDate.setMonth(expDate.getMonth() + (licenseData.expirationInterval * 12));
		if (expDate.getDate() < day) {
			expDate.setDate(1);
			expDate.setDate(expDate.getDate() - 1);
		}
	}
	ELPLogging.debug("expUnits : " + licenseData.expirationUnits + "expInterval : " + licenseData.expirationInterval);
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
	if (capContactResult.getSuccess()) {
		capContactResult = capContactResult.getOutput();
		for (i in capContactResult) {
			var peopleModel = capContactResult[i].getPeople();
			var contactType = String(peopleModel.getContactType());
			if (contactType == "Applicant") {
				var capContactScriptModel = capContactResult[i];
				var capContactModel = capContactScriptModel.getCapContactModel();
				var bDate = capContactModel.getBirthDate();
				if (bDate != null) {
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
LicenseData.prototype.formatLicense = function(recordId, queryResult) {
	var boardCode = queryResult.BOARD_CODE;
	var typeClass = queryResult.TYPE_CLASS;
	ELPLogging.debug("boardCode : " + boardCode + ", typeClass : " + typeClass);
	if (boardCode == "OP" && typeClass == "TP") {
		ELPLogging.debug("Updating Type Class to TPA");
		typeClass = "TPA";
	}
	var licenseNumber = Number(queryResult.LICENSE_NUMBER);
	var licenseNumberS = licenseNumber.toString();
	var customID = licenseNumberS + "-" + boardCode + "-" + typeClass;
	ELPLogging.debug("customID : " + customID);
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
	var expDateS = dateFormattedIntC(expDate, "MM/dd/yyyy");
	ELPLogging.debug("INTAKE EXPIRATION DATE  : " + expDateS);
	ELPLogging.debug("EXPIRATION " + aa.date.parseDate(expDateS));

	var licNum = capId.getCustomID();
	ELPLogging.debug("Setting license expiration date with ALTID : " + licNum + " and expDate : " + expDate + " capId : " + capId);

	try {
		var thisLic = new licenseObject(licNum, capId);
		ELPLogging.debug("thisLic::::" + thisLic);
	} catch (ex) {
		ELPLogging.debug("***licenseObject : " + ex);
	}


	thisLic.setExpiration(expDateS);
	ELPLogging.debug("EXPIRATION", thisLic.b1Exp);
	ELPLogging.debug("EXPIRATION " + thisLic.b1Exp.getB1Expiration());

	thisLic.setStatus("Active");
	ELPLogging.debug("Successfully set the expiration date and status");

	return true;

}

/**
 * This function issues a new license for a PCS Intake Application (Exam)
 * Besides creating the License, it updates the Task Status of the Application to
 * Ready for Printing, and adds the License Id to the Print Set.
 * @param capId - CAP ID of application
 * @param queryResult - PCS information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.issueLicense = function(capId, queryResult) {
	ELPLogging.debug("Testing Inside func issueLicense() for type Class PD & value of type Class From queryResult.typeClass = " + queryResult.TYPE_CLASS);

	if (queryResult.TYPE_CLASS == PD_APP_TYPE || queryResult.BOARD_CODE == "OP" || queryResult.BOARD_CODE == "EM" || queryResult.BOARD_CODE == "SA") {
		//Advance the application record to 'Issuance/Ready to Print' 
		updateAppStatus("Ready for Printing", "Updated via Script", capId);
		deactivateWFTask("Intake", capId);
		deactivateWFTask("Exam", capId);
		activateWFTask("Issuance", capId);
		updateTaskStatus("Issuance", "Ready to Printing", "", "", "", capId);
	} else if ((queryResult.BOARD_CODE == "EM" && queryResult.TYPE_CLASS == "3") || (queryResult.BOARD_CODE == "CH") || (queryResult.BOARD_CODE == "AH")) {
		updateAppStatus("Ready for Printing", "Updated via Script", capId);
		//As per flow work flow Intake and Exam should be deactivate
		deactivateWFTask("Intake", capId);
		deactivateWFTask("Exam", capId);

		// When work flow tasks Intake and Exam are deactivate then next step to activate work flow task to Issuance
		// When Application status is "Ready for Printing" then work flow task should be Issuance
		activateWFTask("Issuance", capId);
	} else {
		updateAppStatus("Printed", "Updated via Script", capId);
		deactivateWFTask("Intake", capId);
		deactivateWFTask("Exam", capId);
		activateWFTask("Issuance", capId);
		updateTaskStatus("Issuance", "Printed", "", "", "", capId);
	}
	var newLicId = this.createLicense(capId, queryResult);
	ELPLogging.debug("New License Object :" + newLicId);
	ELPLogging.debug("Custom ID :" + newLicId.getCustomID());
	var srcCapId = capId;

	if (newLicId != null) {
		var fvShortNotes = getShortNotes(capId);
		updateShortNotes(fvShortNotes, newLicId);
		setContactsSyncFlag("N", newLicId);

		reportName = queryResult.BOARD_CODE + "|LICENSE_REGISTRATION_CARD";
		ELPLogging.debug("Report Name " + reportName);
		var appCreatedBy = this.getCreatedBy(capId);
		if (appCreatedBy != null) {
			editCreatedBy(appCreatedBy, newLicId);
		}


		// EPLACE-4794 **********************************************************
		var skipPrint = false;
		if (queryResult.BOARD_CODE == "EN" && (matches(queryResult.TYPE_CLASS, "EI", "SI", "TP", "LI")) ||
			(queryResult.BOARD_CODE == "PD" && queryResult.TYPE_CLASS == "LL") ||
			(queryResult.BOARD_CODE == "HO")) skipPrint = true;
		if (!skipPrint) {
			callReport(reportName, false, true, "DPL License Print Set", capId);
			ELPLogging.debug("Finished adding # " + capId + " to print set");
		}
		// EPLACE-4794 **********************************************************

		// if (queryResult.TYPE_CLASS != "EI" && queryResult.TYPE_CLASS != "SI" && queryResult.BOARD_CODE != "HO" && (queryResult.TYPE_CLASS != "LI" && queryResult.BOARD_CODE != "EN")) {
		// 	if (queryResult.TYPE_CLASS != "TP" || queryResult.BOARD_CODE == "OP") {
		// 		callReport(reportName, false, true, "DPL License Print Set", capId);
		// 		ELPLogging.debug("Finished adding # " + capId + " to print set");
		// 	}
		// }
		if (queryResult.BOARD_CODE == "PY") {
			//Copy application specific info from application to license.
			copyAppSpecificInfoPCS(capId, newLicId);
		}
		// For CH board, Copy "Education" ASIT from the application record the license record. 
		if (queryResult.BOARD_CODE == "CH" || queryResult.BOARD_CODE == "AH") {
			copyASITable(capId, newLicId, "EDUCATION");
		}

	}
	return newLicId;
}


/**
 * This function creates the License and returns the new License Id (CAP ID)
 * @param capId - CAP ID of Application
 * @param queryResult - PCS information
 * @returns newLicId - CAP ID of new license
 */
LicenseData.prototype.createLicense = function(lcapId, queryResult) {
	var licHolderType = "Licensed Individual";
	var contactType = "Applicant";
	//var contactType = "Business";
	var initStatus = "Current";
	ELPLogging.debug("contactType :" + contactType);
	ELPLogging.debug("licHolderType :" + licHolderType);

	var newLic = null;
	var newLicId = null;
	var newLicIdString = null;
	var boardCode = queryResult.BOARD_CODE;
	var oldAltID = null;
	var AltIDChanged = false;
	var vExpDate = null;
	var licCategory = "License";

	var types = this.getApplicationType(lcapId);

	//create the license record
	//unfortunately requires global capId
	capId = lcapId;
	//If Type class is Temp Permit then the lic category will be Permit.
	if (queryResult.TYPE_CLASS == "TP" && queryResult.boardCode != "OP") {
		licCategory = "Permit";
	}
	ELPLogging.debug("Group : " + types.group + ", Type : " + types.type + ", subType : " + types.subType + ", Category : " + licCategory);
	newLicId = createParent(types.group, types.type, types.subType, licCategory, null);
	ELPLogging.debug("New License Id " + newLicId);
	ELPLogging.debug("New Custom Id : " + newLicId.getCustomID());
	// Remove the ASI and Template tables from all contacts.

	removeContactTemplateFromContact(newLicId);

	if (queryResult.ISSUE_DATE != null) {
		editLicIssueDate(newLicId);
	}

	var sysDate = new Date();
	var sysDateMMDDYYYY = dateFormattedIntC(sysDate, "");
	ELPLogging.debug("sysDateMMDDYYYY " + sysDateMMDDYYYY);
	var rDate = new Date(sysDateMMDDYYYY);
	ELPLogging.debug("sysDateMMDDYYYY ", rDate);
	ELPLogging.debug("sysDateMMDDYYYY " + rDate.getTime());

	editFirstIssuedDate(sysDateMMDDYYYY, newLicId);
	oldAltID = newLicId.getCustomID();

	var asiTypeClass = queryResult.TYPE_CLASS;
	if (boardCode == "OP" && queryResult.TYPE_CLASS == "TP") {
		asiTypeClass = "TPA";
	}
	var licenseNo = queryResult.LICENSE_NUMBER;
	ELPLogging.debug("Board Code : " + boardCode);
	ELPLogging.debug("Type Class : " + asiTypeClass);
	ELPLogging.debug("License No : " + licenseNo);

	//change license Alt ID
	ELPLogging.debug("asiTypeClass : " + asiTypeClass);

	var newAltID = this.formatLicense(capId, queryResult);
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
	ELPLogging.debug("Finished addToLicenseSyncSet for license :" + newLicId);

	if (queryResult.TYPE_CLASS == 'TP' && queryResult.BOARD_CODE != "OP") {
		if (queryResult.LIC_EXP_DATE == "") queryResult.LIC_EXP_DATE = null;
		this.setLicExpirationDate(newLicId, queryResult.LIC_EXP_DATE);
	}

	if (queryResult.LIC_EXP_DATE != "" && queryResult.LIC_EXP_DATE != null) {
		this.setLicExpirationDate(newLicId, queryResult.LIC_EXP_DATE);

		// Defect # 10308 : Start
		if (!(queryResult.BOARD_CODE == "CH" || queryResult.BOARD_CODE == "OP" || queryResult.BOARD_CODE == "AH" || queryResult.BOARD_CODE == "EM" || queryResult.BOARD_CODE == "PD" || queryResult.BOARD_CODE == "SA")) {
			vExpDate = convertDateToScriptDateTime(queryResult.LIC_EXP_DATE);
			ELPLogging.debug("vExpDate :" + vExpDate);
		}
		// Defect # 10308 : End
	}

	/* For below boards licExpirDate field is not required, thus calculate the expiry date and apply on license */
	if (queryResult.BOARD_CODE == "CH" || queryResult.BOARD_CODE == "OP" || queryResult.BOARD_CODE == "AH" || queryResult.BOARD_CODE == "EM") {
		// Calculates the expiration date and sets it over the license
		var boardTypeClass = queryResult.BOARD_CODE + "-" + queryResult.TYPE_CLASS;
		var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
		ELPLogging.debug("boardTypeClass :" + boardTypeClass);
		var expiryDate = this.calculationOfExpDate(queryResult, appConfigInfo, queryResult.licIssueDate);
		this.setLicExpirationDate(newLicId, expiryDate);
		vExpDate = convertDateToScriptDateTime(expiryDate);
	} else if (queryResult.BOARD_CODE == "PD" || queryResult.BOARD_CODE == "SA") {
		// Calculates the expiration date and sets it over the license
		var boardTypeClass = queryResult.BOARD_CODE + "-" + queryResult.TYPE_CLASS;
		var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");

		var expiryDate = this.calculateDPLExpirationDate(capId, queryResult.ISSUE_DATE);
		this.setLicExpirationDate(newLicId, expiryDate);
		vExpDate = convertDateToScriptDateTime(expiryDate);
	}

	licExpirationDate = vExpDate;

	ELPLogging.debug("Creating Ref LP.");
	var licNumberArray = newAltID.split("-");
	var licenseNumber = licNumberArray[0];
	var boardName = licNumberArray[1];
	var licenseType = licNumberArray[2];

	createRefLicProf(licenseNumber, boardName, licenseType, contactType, initStatus, vExpDate, capId);
	newLic = getRefLicenseProf(licenseNumber, boardName, licenseType);


	if (newLic) {
		if (queryResult.ISSUE_DATE != null) {
			ELPLogging.debug("Updating the license issue date as per the interface information");
			updateLicenseIssueDatePCS(licenseNumber, boardName, licenseType, newLic, queryResult);
		}
		ELPLogging.debug("Reference LP successfully created");
		associateLpWithCap(newLic, newLicId);
	} else {
		ELPLogging.debug("Reference LP not created");
	}

	/* JIRA 2356 - Start: updated license issue and expiration date on b3contra table */
	licenseProfessional = getLicenseProfessional(newLicId);

	if (queryResult.ISSUE_DATE != null) {
		sysDate = queryResult.ISSUE_DATE;
	}
	var vIssueDate = convertDateToScriptDateTime(sysDate);
	if (licenseProfessional) {
		for (var thisCapLpNum in licenseProfessional) {
			var licProf = licenseProfessional[thisCapLpNum];

			var licNbrB3contra = licProf.getLicenseNbr();
			var boardCodeB3contra = licProf.getComment();
			var typeClassB3Contra = licProf.getBusinessLicense();

			if ((licenseNumber == licNbrB3contra) && (boardName == boardCodeB3contra) && (licenseType == typeClassB3Contra)) {
				licProf.setLicenseExpirDate(licExpirationDate);
				licProf.setLicesnseOrigIssueDate(vIssueDate);
				aa.licenseProfessional.editLicensedProfessional(licProf);
			}
		}
	}
	/* JIRA 2356 - End: updated license issue and expiration date on b3contra table */

	conToChange = null;
	cons = aa.people.getCapContactByCapID(newLicId).getOutput();
	//ELPLogging.debug("Contacts:" + cons);
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

LicenseData.prototype.checkLicenseNumber = function(recordId, queryResult) {
	ELPLogging.debug("Checking license sequence number availability");
	var newAltID = this.formatLicense(recordId, queryResult);
	ELPLogging.debug("Check Alt ID: " + newAltID);
	var capListResult = aa.cap.getCapID(newAltID);
	if (capListResult.getSuccess()) {
		var capID = capListResult.getOutput();
		ELPLogging.debug("License already exists", capID);
		return false;
	} else {
		ELPLogging.debug("License number is available " + newAltID);
		return true;
	}
}

/**
 * This function validates the PCS data, to insure the data is consistent with the information
 * in Accela before processing the Exam results and License issuance. Currently the License Number
 * and the Expiration Date are validated.
 * @param capId - CAP ID of Application
 * @param queryResult - PCS data
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validatePCSData = function(capId, queryResult) {
	ELPLogging.debug("PARAMETERS", queryResult);
	var issueDateObj = queryResult.ISSUE_DATE;
	var inputExpDate = queryResult.LIC_EXP_DATE;
	var expDate = this.calculateDPLExpirationDate(capId, issueDateObj);
	var types = this.getApplicationType(capId);

	var lastSequenceNbr = this.configurations[this.capTypeAlias].lastSequenceNbr;
	lastSequenceNbr++;
	ELPLogging.debug("Next SequenceNbr " + lastSequenceNbr);

	var validationFlagArray = {};
	var inputLicNo = Number(queryResult.LICENSE_NUMBER);
	if (inputExpDate != null) {
		validationFlagArray.licenseExpirationFlag = this.validateExpirationDate(inputExpDate, expDate);

	} else {
		validationFlagArray.licenseExpirationFlag = true;
	}
	validationFlagArray.licenseNumberFlag = this.validateLicenseNumber(inputLicNo, lastSequenceNbr);
	validationFlagArray.expDate = expDate;
	return validationFlagArray;
}


/**
 * This function validates the expiration date
 * @param inputExpDate - Expiration Date from PCS
 * @param expDate - Expiration Date calculated in Accela
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.validateExpirationDate = function(inputExpDate, expDate) {
	ELPLogging.debug("Validating the expiration Date. Input :" + inputExpDate + ", Calculated : " + expDate);
	var inputExpDateS = dateFormattedIntC(inputExpDate, "MMDDYYYY");
	var expDateS = dateFormattedIntC(expDate, "MMDDYYYY");
	ELPLogging.debug("Input Date : " + inputExpDateS);
	ELPLogging.debug("Exp Date Calculated : " + expDateS);
	if (inputExpDateS == expDateS) {
		return true;
	} else {
		return false;
	}

}

/**
 * This function validates the License Number
 * @param inputLicNo - License Number from PCS
 * @param licNo - next License Number in Accela (LICENSE_SEQUENCE_NUMBER standard choice)
 * @returns boolean - true if number is valie, false if number is not valid
 */

LicenseData.prototype.validateLicenseNumber = function(inputLicNo, lastSequenceNbr) {
	var validationResult = false;
	var loopBreaker = true;
	ELPLogging.debug("Validating license Number.");
	while (loopBreaker) {
		if (inputLicNo == lastSequenceNbr) {
			ELPLogging.debug("InputlicNo and lastSequenceNbr are same");
			validationResult = true;
			loopBreaker = false;
			lastSequenceNbr = this.configurations[this.capTypeAlias].lastSequenceNbr++;
		}
		// Insert an error in Error table if Intake file License number is less than the License Sequence number in standard choice.
		else if (inputLicNo < lastSequenceNbr) {
			ELPLogging.debug("InputlicNo < lastSequenceNbr");
			var errorMessage = queryResult.boardCode + ":License Number is less than the expected license number";
			// Inserting error in Error table.
			var emseInsertParameters = {
				"BatchInterfaceName": queryResult.batchInterfaceName,
				"RecordID": queryResult.recordID,
				"ErrorDescription": errorMessage,
				"runDate": new Date(batchAppResultObj.runDate)
			};

			callToStoredProcedure(emseInsertParameters, "errorTableInsert");

			ELPLogging.debug("License sequence number " + queryResult.licenseNumber + " in intake file is less then the next license sequence number " + this.configurations[this.capTypeAlias].lastSequenceNbr + " Error -- " + errorMessage);

			validationResult = false;
			loopBreaker = false;
		}
		// Insert an error in Error table if Intake file License number is greater than the License Sequence number in standard choice.
		// Also increment the standard choice license sequence number.
		else {
			ELPLogging.debug("InputlicNo > lastSequenceNbr");
			var errorMessage = queryResult.boardCode + ": License Number is greater than the expected license number, The expected license sequence number was " + this.configurations[this.capTypeAlias].lastSequenceNbr;
			// Inserting error in Error table.
			var emseInsertParameters = {
				"BatchInterfaceName": queryResult.batchInterfaceName,
				"RecordID": queryResult.recordID,
				"ErrorDescription": errorMessage,
				"runDate": new Date(batchAppResultObj.runDate)
			};

			callToStoredProcedure(emseInsertParameters, "errorTableInsert");

			ELPLogging.debug("License sequence number " + queryResult.licenseNumber + " in intake file is greater then the next license sequence number " + this.configurations[this.capTypeAlias].lastSequenceNbr + " Error -- " + errorMessage);

			lastSequenceNbr = ++this.configurations[this.capTypeAlias].lastSequenceNbr;
		}
	}

	return validationResult;
}


/**
 * This function converts a JS Date to a Accela ScriptDateTime
 * @param jsDate - JS Date
 * @returns accelaDate - ScriptDateTime
 */
function convertDateToScriptDateTime(jsDate) {
	ELPLogging.debug("convertDateToScriptDateTime method :" + jsDate);
	var utilDate = convertDateToJavaDate(jsDate);
	var accelaDate = aa.date.getScriptDateTime(utilDate);
	ELPLogging.debug("Finished convertDateToScriptDateTime to :" + accelaDate);
	return accelaDate;
}

/**
 * This function converts a JS Date to a Java Util Date
 * @param jsDate - JS Date
 * @returns utilDate - Java Util Date
 */
function convertDateToJavaDate(jsDate) {
	ELPLogging.debug("convertDateToJavaDate method :" + jsDate);
	var utilDate = new java.util.Date(jsDate.getTime());
	ELPLogging.debug("Finished convertDateToJavaDate method :" + utilDate);
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
		updateStandardChoice("LICENSE_SEQUENCE_NUMBER", type, stdDesc);
	}
}

function deactivateWFTask(wfstr, capId) {

	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
		return false;
	}
	var wfnote = null;
	var wfcomment = "Closed by Script";
	for (i in wfObj) {
		var fTask = wfObj[i];
		ELPLogging.debug(fTask.getTaskDescription() + "----" + fTask.getProcessCode());
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
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

function activateWFTask(wfstr, capId) {

	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
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
			ELPLogging.debug("Activating Workflow Task: " + wfstr.toUpperCase());
		}
	}
}

function closeTask(wfstr, wfstat, wfcomment, wfnote) // optional process name
{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5) {
		processName = arguments[4]; // subprocess
		useProcess = true;
	}

	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
		return false;
	}

	if (!wfstat) wfstat = "NA";

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y");
			else
				aa.workflow.handleDisposition(capId, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "Y");

			logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat);
			ELPLogging.debug("Closing Workflow Task: " + wfstr + " with status " + wfstat);
		}
	}
}

/**
 * This function validates the SSN number
 * @param socSecNumber - SSN number
 * @returns boolean : 
	1. ssnFlag : This flag shows that SSN number flag contains alpha numeric value or not.
	2. ssnExpressionLogic : This flag shows that expression logic validated or not.
 */
function validateSSN(socSecNumber) {
	ELPLogging.debug("Validating SSN : " + socSecNumber);
	var ssnValidation = {};

	// SSN number should not contain the alpha characters.
	if (!isNaN(socSecNumber)) {
		// SSN number should follow the expression logic.
		if (socSecNumber.match(/^(?!\b(\d)\1+\b)(?!123456789|219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/)) {
			ssnValidation.ssnExpressionLogic = false;
			ssnValidation.ssnFlag = true;
		} else {
			ELPLogging.debug("Invalid Expression logic for SSN Number.");
			ssnValidation.ssnExpressionLogic = true;
			ssnValidation.ssnFlag = false;
		}
	} else {
		ELPLogging.debug("Invalid SSN.");
		ssnValidation.ssnFlag = false;
		ssnValidation.ssnExpressionLogic = false;
	}

	return ssnValidation;
}

/** 
 * @desc: This method creates a set on a monthly basis for each board in a exam vendor file.
 * 		 If the set already exists for the month it should not create a new one and simply return the existing set name		
 * @param: {String} boardCode - contains the board code.
 * @param: {String} vendor - contains the vendor name.
 * @throws:  N/A
 */
function getMonthlyPaymentSet(boardCode) {
	ELPLogging.debug("Creating monthly payment set.");
	var pJavaScriptDate = new Date();

	month = pJavaScriptDate.getMonth() + 1;

	if (month < 10) {
		var formattedMonth = "0" + month;
	} else {
		var formattedMonth = month;
	}

	var dateStr = formattedMonth + "_" + pJavaScriptDate.getFullYear();

	// Set name to be created
	//var setName = boardCode+"|MONTHLY_PAYMENT|"+vendor+"|"+dateStr;
	var setName = "DPL_PCS_EXAM_" + boardCode + "_" + dateStr;

	//Check if set already exist.
	var setResult = aa.set.getSetByPK(setName);

	if (setResult.getSuccess()) {
		ELPLogging.debug("Monthly payment set: " + setName + " already exists.");
	} else {
		// Create a new set if it does not already exists.
		var newSetResult = aa.set.createSet(setName, setName);
		if (newSetResult.getSuccess()) {
			ELPLogging.debug("Successfully created Set: " + setName);
		} else {
			ELPLogging.debug("Unable to create set " + setName + " : \n Error: " + ScriptReturnCodes.EMSE_PROCEDURE);
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
function addApplicationRecordToMonthlyPaymentSet(setName, capID) {
	var scanner = new Scanner(capID.toString(), "-");

	var id1 = scanner.next();
	var id2 = scanner.next();
	var id3 = scanner.next();

	var capIDModel = aa.cap.getCapID(id1, id2, id3).getOutput();
	var setFlag = false;

	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();

	setDetailScriptModel.setSetID(setName);
	setDetailScriptModel.setID1(id1);
	setDetailScriptModel.setID2(id2);
	setDetailScriptModel.setID3(id3);

	var memberListResult = aa.set.getSetMembers(setDetailScriptModel);

	if (memberListResult.getSuccess()) {
		var memberList = memberListResult.getOutput();

		//If the member list size is more than zero then record present in the set
		if (memberList.size()) {
			ELPLogging.debug("Application record already exists in the set");
		} else {
			aa.set.add(setName, capIDModel);
			ELPLogging.debug("Application record added to the set - " + setName);
		}

		setFlag = true;
	}

	return setFlag;
}

/** 
 * @desc This script validates if the phone number value is populated without any alpha characters.
 * @param {String} phoneNumber - contains the phone number in String format 
 * @returns {Boolean} validation flag
 * @throws  N/A
 */
function validatePhoneNumber(phoneNumber) {
	var validationResult = false;
	var scanner = new Scanner(phoneNumber, "-");
	var formattedPhNumber = scanner.next() + scanner.next() + scanner.next();

	if (!isNaN(formattedPhNumber)) {
		validationResult = true;
		ELPLogging.debug("Phone Number validated");
	} else {
		ELPLogging.debug("Invalid Phone Number");
	}

	return validationResult;
}


function getSharedDropDownDescription(listName, discipCode) {
	var discipValue = "";
	var bizDomScriptResult = aa.bizDomain.getBizDomain(String(listName)); //call function to retrieve standard choice

	// get the standard choice where the list is stored.
	if (bizDomScriptResult.getSuccess()) {
		// if found get the list
		var bizDomObj = bizDomScriptResult.getOutput();
		if (bizDomObj.isEmpty()) {
			ELPLogging.notify("Standard Choice - " + listName + " not exist ");
			return null;
		}

		var bizArr = bizDomObj.toArray();
		for (var x in bizArr) {
			if (discipCode == bizArr[x].getDispBizdomainValue()) {
				discipValue = bizArr[x].getDescription();
			}
		}
	}
	return discipValue;
}



/** 
 * @desc This method will update EXAM VENDOR CASH INFO on the record
 * @param {capId} capId - contains Application record id.
 */
function updateExamVendorCashInfo(capId) {
	ELPLogging.debug("Updating exam cash vendor info ASIT for record ID = " + capId);
	//Fix for defect 5486 : Retrieve Fee info
	var feeAmount = retrieveFeeAmountFromApplicationRecord(capId, queryResult.recordType);
	var feeType = retrieveFeeType(queryResult.recordType);

	ELPLogging.debug("feeAmount = " + feeAmount + " -- feeType = " + feeType);

	var tableExamVendorCashInfoValuesArray = {};
	tableExamVendorCashInfoValuesArray["Cash Date"] = (queryResult.cashDate != null && queryResult.cashDate.length != 0) ? jsDateToMMDDYYYY(queryResult.cashDate) : "";
	tableExamVendorCashInfoValuesArray["Cash Number"] = (queryResult.cashNumber != null) ? String(queryResult.cashNumber) : "";
	tableExamVendorCashInfoValuesArray["Fee Type"] = String(feeType);
	tableExamVendorCashInfoValuesArray["Fee Amount"] = String(feeAmount);

	addASITValueToRecord("EXAM VENDOR CASH INFO", tableExamVendorCashInfoValuesArray, capId);
}

/** 
 * @desc This method retrieves fee type based on record type
 * @param {recordType} recordType - contains recordType.
 */
function retrieveFeeType(recordType) {
	var feeType = null;
	switch (String(recordType)) {
		case "2":
			{
				feeType = "A";
				break;
			}
		case "3":
			{
				feeType = "L";
				break;
			}

	}

	return feeType;
}


/** 
 * @desc This method retrieves fee amount on Application to update Fee Amount ASIT
 * @param {capIDModel} capId - contains Application record id.
 */
function retrieveFeeAmountFromApplicationRecord(capIDModel, recordType) {
	ELPLogging.debug("Retrieving Fee amount for Application record = " + capIDModel);
	var feeAmount = "";

	var feeItemScriptModelResult = aa.finance.getFeeItemByCapID(capIDModel);
	if (feeItemScriptModelResult.getSuccess()) {
		ELPLogging.debug("Inside the method to retrieve feeamount");
		var feeItemScriptModel = feeItemScriptModelResult.getOutput();
		for (index in feeItemScriptModel) {
			var feeCode = feeItemScriptModel[index].getFeeCod();

			var recordTypeFeeCode = retrieveFeeCode(capIDModel, recordType);

			ELPLogging.debug("feeCode = " + feeCode + " -- recordTypeFeeCode = " + recordTypeFeeCode);
			if (feeCode == recordTypeFeeCode) {
				feeAmount = feeItemScriptModel[index].getFee();
				ELPLogging.debug("feeAmount = " + feeAmount);
			}
		}
	} else {
		ELPLogging.debug("Fee Amount not found for = " + capIDModel);
		feeAmount = "0";
	}
	return feeAmount;
}

/** 
 * @desc This method retrieves rbiz domain value based on the description
 * @param {capIDModel} capId - contains Application record id.
 */
function getSharedDropDownValue(aliasDescription, stdChoiceName) {
	ELPLogging.debug("Evaluating standard choice");
	var aliasType = "";
	//call function to retrieve standard choice
	var bizDomScriptResult = aa.bizDomain.getBizDomain(String(stdChoiceName));

	if (bizDomScriptResult.getSuccess()) {
		var bizDomObj = bizDomScriptResult.getOutput();

		if (bizDomObj.isEmpty()) {
			ELPLogging.notify("Standard Choice - " + stdChoiceName + " not exist ");
			return null;
		}

		var bizArr = bizDomObj.toArray();
		for (var index in bizArr) {
			if (aliasDescription.toUpperCase() == bizArr[index].getDescription().toUpperCase()) {
				// loop through and populate the Array with the Description
				aliasType = bizArr[index].getDispBizdomainValue();
				ELPLogging.debug("aliasType retrieved from the standard choice." + aliasType);
			}
		}
	}
	return aliasType;
}
/**
 * @desc This method format the phone number in US format
 * @param {phone} String - contains phone number.
 */
function formatPhoneNumber(phone) {
	ELPLogging.debug("-----------------------------formatPhoneNumber starts for phone#----------------- " + phone);
	var formattedPhone = "";
	return formattedPhone = '(' + phone.substr(0, 3) + ')' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
	ELPLogging.debug("-----------------------------formatPhoneNumber end#----------------- ");
}

//Added for CR 274
function sendEmailToApplicantApprovedToSit(wfTask, wfStatus, capId) {
	try {
		if (wfTask == "Validate" && wfStatus == "Approved to Sit for Exam") {
			var applicantname;
			var applicantEmailAdr = undefined;
			var boardCode;
			var emailTemplate;

			boardCode = "EN";
			emailTemplate = "AA_EN_APPROVED_FOR_EXAM_NOTIFICATION";

			var boardName = String(lookup("BOARD_CODE_INT_RECORD_TYPE", boardCode));

			var capContactResult = aa.people.getCapContactByCapID(capId);
			if (capContactResult.getSuccess()) {
				capContactResult = capContactResult.getOutput();

				for (yy in capContactResult) {
					var thisCapContact = capContactResult[yy];
					var thisPeople = thisCapContact.getPeople();

					var thisContactType = thisPeople.getContactType();

					if (thisContactType == "Applicant") {
						applicantname = thisPeople.getContactName();
						applicantEmailAdr = thisPeople.getEmail();
						ELPLogging.debug("Approved to sit for exam to send an email to : " + applicantEmailAdr)
					}
				}
			}
			ELPLogging.debug("capId.getCustomID() :: " + capId.getCustomID())
			var senderEmailAddr = "Noreply@elicensing.state.ma.us";
			var params = aa.util.newHashtable();
			addParameter(params, "$$altId$$", capId.getCustomID());
			addParameter(params, "$$applicantFullName$$", applicantname);
			addParameter(params, "$$boardName$$", boardName);

			if (applicantEmailAdr != undefined && applicantEmailAdr != null) {
				ELPLogging.debug("Sending E-mail to " + applicantname + " " + applicantEmailAdr + " from board " + boardName);
				sendNotificationToApplicant(senderEmailAddr, applicantEmailAdr, "", emailTemplate, params, null, capId);
			} else {
				ELPLogging.debug("There is no email address associated with the applicant");
			}
		}
	} catch (err) {
		//showMessage=true;
		// comment("Error on WTUA function CWM_ELP_914_WTUA_DPL_email_Applicant_ApprovedToSit, Please contact administrator");

		ELPLogging.debug("There is no email address associated with the applicant" + err.message);
	}
}

function sendNotificationToApplicant(e, t, n, r, i, s, capId) {
	var o = capId;
	if (arguments.length == 7) o = arguments[6];
	var u = o.ID1;
	var a = o.ID2;
	var f = o.ID3;
	var l = aa.cap.createCapIDScriptModel(u, a, f);
	var c = null;
	c = aa.document.sendEmailAndSaveAsDocument(e, t, n, r, i, l, s);
	if (c.getSuccess()) {
		ELPLogging.debug("Sent email successfully!");
		return true
	} else {
		ELPLogging.debug("Failed to send mail. - " + c.getErrorType());
		return false
	}
}

function updateLicenseIssueDatePCS(rlpId, ipBoadName, rlpType, newLic, queryResult) {

	var sysDate = new Date();
	var rlpBoadName = getLegalBoardName(ipBoadName);
	newLic.setServiceProviderCode(aa.getServiceProviderCode());
	newLic.setAgencyCode(aa.getServiceProviderCode());

	newLic.setStateLicense(rlpId);
	newLic.setBusinessLicense(rlpType);
	newLic.setLicenseBoard(rlpBoadName);


	if (queryResult.ISSUE_DATE != null) {
		sysDate = queryResult.ISSUE_DATE;
	}
	var vIssueDate = convertDateToScriptDateTime(sysDate);

	newLic.setLicOrigIssDate(vIssueDate);
	newLic.setLicenseIssueDate(vIssueDate);
	//newLic.setLicenseExpirationDate(expDate);

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
function editLicIssueDate(capIDModel) {
	ELPLogging.debug("Update license file DD to license issue date from intake file for record ID = " + capIDModel);

	ELPLogging.debug("Test ----- >")

	var capResult = aa.cap.getCap(capIDModel);
	var capScriptModel = capResult.getOutput();

	if (capScriptModel) {
		//set values for CAP record
		var capModel = capScriptModel.getCapModel();
		capModel.setReportedDate(new java.util.Date(queryResult.licIssueDate));
		capModel.setFileDate(new java.util.Date(queryResult.licIssueDate));

		var editResult = aa.cap.editCapByPK(capModel);
		if (!editResult.getSuccess()) {
			var returnException = new ELPAccelaEMSEException("Error editing the CAP ASI for " + capIDModel + ": " + editResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;

		}
		return capIDModel;
	} else {
		var returnException = new ELPAccelaEMSEException("Error retrieving the CAP " + capIDModel + ": " + capResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}


}

function copyAppSpecificInfoPCS(srcCapId, targetCapId) {
	//1. Get Application Specific Information with source CAPID.
	var appSpecificInfo = getAppSpecificInfoPCS(srcCapId);
	if (appSpecificInfo == null || appSpecificInfo.length == 0) {
		return;
	}
	//2. Set target CAPID to source Specific Information.
	for (loopk in appSpecificInfo) {
		var sourceAppSpecificInfoModel = appSpecificInfo[loopk];

		sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
		sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
		sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
		//3. Edit ASI on target CAP (Copy info from source to target)
		var result = aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
		if (result.getSuccess()) {
			ELPLogging.debug("Applciation specific value updated successfully to License!");
		} else {
			ELPLogging.debug("Error: " + result.getErrorMessage());
		}
	}
}

function getAppSpecificInfoPCS(capId) {
	var capAppSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(capId);
	if (s_result.getSuccess()) {
		capAppSpecificInfo = s_result.getOutput();
		if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0) {
			ELPLogging.debug("WARNING: no appSpecificInfo on this CAP:" + capId);
			capAppSpecificInfo = null;
		}
	} else {
		ELPLogging.debug("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
		capAppSpecificInfo = null;
	}
	// Return AppSpecificInfoModel[] 
	return capAppSpecificInfo;
}


/**
 * This function validates the License Number
 * If valid, it increments the value in the configurations
 * @param capId - CAP ID of Application
 * @param queryResult - data
 * @returns boolean - true if number is valie, false if number is not valid
 */
LicenseData.prototype.validateLicenseNumberForReleaseCboards = function(queryResult, appConfigInfo) {
	var types = this.getApplicationTypeForAppRecord(appConfigInfo);

	var lastSequenceNbr = this.configurations[types.capTypeAlias].lastSequenceNbr;

	ELPLogging.debug("Last sequence number : " + lastSequenceNbr);

	var inputLicNo = Number(queryResult.licenseNumber);
	ELPLogging.debug("input License number : " + inputLicNo);

	var resendFlag = false;

	var validationFlagArray = {};
	validationFlagArray.resendFlag = resendFlag;

	var validationResult = false;

	var loopBreaker = true;
	if (!isNaN(inputLicNo)) {
		while (loopBreaker) {
			if (inputLicNo == lastSequenceNbr) {
				ELPLogging.debug(inputLicNo + " == " + lastSequenceNbr)
				ELPLogging.debug("Input license number is equals to lastSequenceNbr");
				lastSequenceNbr = ++this.configurations[types.capTypeAlias].lastSequenceNbr;
				this.updateLicenseSequenceNumbers();
				validationFlagArray.validationResult = true;
				loopBreaker = false;
			} else if (inputLicNo < lastSequenceNbr) {
				ELPLogging.debug(inputLicNo + " < " + lastSequenceNbr);
				validationFlagArray.resendFlag = true;
				validationFlagArray.validationResult = true;
				loopBreaker = false;
			} else {
				ELPLogging.debug(inputLicNo + " > " + lastSequenceNbr);

				ELPLogging.debug("License sequence number " + queryResult.licenseNumber + " in intake file is greater then the next license sequence number " + this.configurations[types.capTypeAlias].lastSequenceNbr);

				var recordID;
				if ((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null)) {
					recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
				} else if ((queryResult.firstName != null) && (queryResult.lastName != null)) {
					recordID = queryResult.firstName + " " + queryResult.lastName;
				}

				var errorMessage = queryResult.boardCode + ": License Number is greater than the expected license number, The expected license sequence number was " + this.configurations[types.capTypeAlias].lastSequenceNbr;

				// Inserting error in Error table.
				var emseInsertParameters = {
					"BatchInterfaceName": queryResult.batchInterfaceName,
					"RecordID": recordID,
					"ErrorDescription": errorMessage,
					"runDate": runDate
				};

				callToStoredProcedure(emseInsertParameters, "errorTableInsert");



				lastSequenceNbr = ++this.configurations[types.capTypeAlias].lastSequenceNbr;
			}
		}
	} else {
		ELPLogging.debug("License number contains Alpha characters.");
		validationFlagArray.resendFlag = resendFlag;
		validationFlagArray.validationResult = validationResult;
	}


	return validationFlagArray;
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


/**
 * This function validates the expiration date
 * @param capId - CAP ID of Application
 * @param queryResult - data
 * @returns boolean - true if valid, false if not valid
 */
LicenseData.prototype.performValidationForExpDate = function(queryResult, appConfigInfo) {
	ELPLogging.debug("Validating license expiration date.");

	var issueDateObj = queryResult.licIssueDate;
	var inputExpDate = queryResult.licExpirDate;

	if ((queryResult.boardCode == "EM" && (queryResult.licIssueDate == null || queryResult.licExpirDate == null)) || (queryResult.boardCode == "CH" && queryResult.licIssueDate == null)) {
		return false;
	}

	var expDate = this.calculationOfExpDate(queryResult, appConfigInfo, issueDateObj);
	if ((queryResult.boardCode == "CH" || queryResult.boardCode == "AH" || queryResult.boardCode == "OP") && queryResult.licExpirDate == null) {
		inputExpDate = expDate;
	}
	var inputExpDateS = dateFormattedIntC(inputExpDate, "MMDDYYYY");
	var expDateS = dateFormattedIntC(expDate, "MMDDYYYY");
	ELPLogging.debug("Expiration Date:        " + inputExpDateS);
	ELPLogging.debug("Calculated Expiration Date: " + expDateS);
	if (inputExpDateS == expDateS) {
		return true;
	} else {
		return false;
	}
}

/**
 * This function is a copy of the calculationOfExpDate in INCLUDES_CUSTOM
 * Instead of updating the License, the calculated value is returned.
 * @param capId - Cap Id of Application
 * @returns expDate - Expiration Date of prospective License
 */
LicenseData.prototype.calculationOfExpDate = function(queryResult, appConfigInfo, issueDateObj) {
	ELPLogging.debug("Calculating DPL license expiration date.");
	//Variables
	var bDateObj;
	var isYearAddedToExpDate = false;
	var expDate = new Date();
	if (issueDateObj == null) {
		issueDateObj = expDate;
	}

	//Check for Record Type
	var applicationType = this.getApplicationTypeForAppRecord(appConfigInfo);
	ELPLogging.debug("Record Type: " + applicationType.type + "/" + applicationType.subType);

	var licenseData = this.retrieveLicenseData(applicationType.capTypeAlias, applicationType.subType);
	ELPLogging.debug("Expiration code is : " + licenseData.expirationCode);

	var expirationCode = String(licenseData.expirationCode);
	switch (expirationCode) {
		case LICENSE_EXPIRATION_CODES.OCTOBER_31ST:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.OCTOBER_31ST);
			if (issueDateObj != null) {
				var issueMonth = issueDateObj.getMonth();
				issueMonth = issueMonth + 1;
				var issueDate = issueDateObj.getDate();
				var issueDateYear = issueDateObj.getFullYear();

				var month = licenseData.expirationMonth;
				var date = licenseData.expirationDay

				var august1st = new Date();
				august1st.setDate(1);
				august1st.setMonth(month - 3);
				august1st.setFullYear(issueDateYear);

				var dec31st = new Date();
				dec31st.setMonth(month + 1, 31);
				dec31st.setFullYear(issueDateYear);

				ELPLogging.debug("Set the expiration date on the new license to October 31 of the current year.");
				// JIRA 4122
				//var currentDate = new Date();
				expDate.setFullYear(issueDateObj.getFullYear());
				expDate.setMonth(month - 1);
				expDate.setDate(31);

				if ((issueDateObj >= august1st) && (issueDateObj <= dec31st) && licenseData.expirationUnits == "Years") {
					ELPLogging.debug("license is issued between August 1 and December 31, then add one year to the expiration date.");
					var expYr = expDate.getFullYear();
					expYr = expYr + 1;
					expDate.setFullYear(expYr);
					isYearAddedToExpDate = true;
				} else {
					isYearAddedToExpDate = true;

				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.MARCH_31_ANNUAL:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.MARCH_31_ANNUAL);
			isYearAddedToExpDate = false;
			if (issueDateObj != null) {
				// Issue date artifacts
				var issueDateYear = issueDateObj.getFullYear();
				var month = licenseData.expirationMonth - 1;
				var date = licenseData.expirationDay;

				// Date range start date
				var baseLineDate = new Date();
				baseLineDate.setMonth(11, 1);
				baseLineDate.setFullYear(issueDateYear);
				// Date range end date
				var baseLineEndDate = new Date();
				baseLineEndDate.setMonth(11, 31);
				baseLineEndDate.setFullYear(issueDateYear);

				expDate.setMonth(month, date);
				if (issueDateObj < baseLineDate) {
					//set the expiration date of the license to 03/31 of the next year
					expDate.setFullYear(issueDateYear);
				} else if (issueDateObj >= baseLineDate && issueDateObj <= baseLineEndDate) {
					//set the expiration date of the license to 03/31 in 2 years
					expDate.setFullYear(issueDateYear + 1);
				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.BIRTHDAY_BIENNIAL:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.BIRTHDAY_BIENNIAL);
			isYearAddedToExpDate = false;
			var bDateObj = queryResult.dateOfBirth;
			ELPLogging.debug("Birth Date : " + bDateObj);
			if ((issueDateObj != null) && (bDateObj != null)) {
				var issueDateYear = issueDateObj.getFullYear();
				expDate.setDate(bDateObj.getDate());
				expDate.setMonth(bDateObj.getMonth());
				if (bDateObj.getMonth() > issueDateObj.getMonth()) {
					expDate.setFullYear((issueDateYear - 1));
				} else {
					expDate.setFullYear(issueDateYear);
				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.BIRTHDATE_2YR:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.BIRTHDATE_2YR);
			isYearAddedToExpDate = false;
			var bDateObj = queryResult.dateOfBirth;
			ELPLogging.debug("Birth Date : " + bDateObj);
			if ((issueDateObj != null) && (bDateObj != null)) {
				var issueDateYear = issueDateObj.getFullYear();
				expDate.setDate(bDateObj.getDate());
				expDate.setMonth(bDateObj.getMonth());
				if (bDateObj.getMonth() > issueDateObj.getMonth()) {
					expDate.setFullYear((issueDateYear - 1));
				} else {
					expDate.setFullYear(issueDateYear);
				}
			}
			break;
		case LICENSE_EXPIRATION_CODES.JAN_31_ANNUAL:
			ELPLogging.debug(LICENSE_EXPIRATION_CODES.JAN_31_ANNUAL);
			isYearAddedToExpDate = false;
			if (issueDateObj != null) {
				// Issue date artifacts
				var issueDateYear = issueDateObj.getFullYear();
				var month = licenseData.expirationMonth - 1;
				var date = licenseData.expirationDay;

				// Date range start date
				var baseLineDate = new Date();
				baseLineDate.setMonth(9, 1);
				baseLineDate.setFullYear(issueDateYear);
				// Date range end date
				var baseLineEndDate = new Date();
				baseLineEndDate.setMonth(11, 31);
				baseLineEndDate.setFullYear(issueDateYear);

				expDate.setMonth(month, date);
				if (issueDateObj < baseLineDate) {
					//set the expiration date of the license to 01/31 of the next year
					expDate.setFullYear(issueDateYear);
				} else if (issueDateObj >= baseLineDate && issueDateObj <= baseLineEndDate) {
					//set the expiration date of the license to 01/31 in 2 years
					expDate.setFullYear(issueDateYear + 1);
				}
			}
			break;
		default:
			ELPLogging.debug("DEFAULT " + licenseData.expirationCode);
			break;
	}

	ELPLogging.debug("Expiration date to pass: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());
	if (licenseData.expirationUnits == null) {
		var returnException = new ELPAccelaEMSEException("Could not set the expiration date, no expiration unit defined for expiration code: " + this.b1Exp.getExpCode(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.debug(returnException.toString());
		throw returnException;
	}

	if (licenseData.expirationUnits == "Days" || licenseData.expirationUnits == "Months") {
		isYearAddedToExpDate = false;
	}

	if (licenseData.expirationUnits == "Days" && !isYearAddedToExpDate) {
		expDate.setDate(expDate.getDate + licenseData.expirationInterval);
	}

	if (licenseData.expirationUnits == "Months" && !isYearAddedToExpDate) {
		var day = expDate.getDate();
		expDate.setMonth(expDate.getMonth() + pMonths);
		if (expDate.getDate() < day) {
			expDate.setDate(1);
			expDate.setDate(expDate.getDate() - 1);
		}
	}

	if (licenseData.expirationUnits == "Years" && !isYearAddedToExpDate) {
		var day = expDate.getDate();
		expDate.setMonth(expDate.getMonth() + (licenseData.expirationInterval * 12));
		if (expDate.getDate() < day) {
			expDate.setDate(1);
			expDate.setDate(expDate.getDate() - 1);
		}
		ELPLogging.debug(" Expiration date calculation whose Expiration unit in config table (ELP_VW_LICENSE_CONFIG_DPL) is years " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());

	}
	ELPLogging.debug("Expiration date calculated: " + (expDate.getMonth() + 1) + "/" + expDate.getDate() + "/" + expDate.getFullYear());
	return expDate;
}

// POC
/**
 * @description Get the record count in the staging table to be processed.
 * @param  {string} serviceProviderCode
 * @param  {string} batchInterfaceName
 * @param  {date} runDate
 * @return {int} record count
 */
// function countStagingRecords(serviceProviderCode, batchInterfaceName, runDate) {
//     var count = 0;
//     try {
//         var array = [];
//         var tableName = selectQueryObj.selectQuery.table;

//         var stagingQueryParameters = {
//             "serviceProviderCode": serviceProviderCode,
//             "batchInterfaceName": batchInterfaceName,
//             "runDate": runDate,
//             "tableName": tableName
//         };
        
//         var dataSet = getStgRecords(stagingQueryParameters);

//         var queryResult = null;
//         while ((queryResult = dataSet.next()) != null) {
//             count++;
//         }

//     } catch (ex) {
//         ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
//     }
//     return count;
// }

// POC
/**
 * @description Query records from the staging table and returns a DataSet
 * @param  {array} parameters
 * @return {DataSet} DataSet object
 */
// function getStgRecords(parameters) {
//     var dataSet = null;
//     try {
//         var sql = "select * from " + parameters["tableName"] + " where service_provider_code = ? and batch_interface_name = ? and run_date like ?";
//         var stmt = dbConn.prepareStatement(sql);
//         stmt.setString(1, parameters["serviceProviderCode"]);
//         stmt.setString(2, parameters["batchInterfaceName"]);
//         var sql_date = new java.sql.Date(parameters["runDate"].getTime());
//         stmt.setDate(3, sql_date);

//         var rs = stmt.executeQuery();

//         var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
//         var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

//         dataSet = ds;

//     } catch (ex) {
//         ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
//     }
//     return dataSet;
// }

