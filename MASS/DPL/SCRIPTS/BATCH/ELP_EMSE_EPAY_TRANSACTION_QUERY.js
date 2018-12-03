/**
 * @file - ELP_EMSE_EPAY_TRANSACTION_QUERY:
 * This file contains the Script to return ETRANSACTION information to the EPay Adapter 

 */

var returnException;

// POC
var selectQueryObj = {
	"queryResultSet": {
		"table": "ELP_VW_EPAY_TRANSACTION",
		"resultSet": {
			"list": [{
				"source": "RESULT",
				"name": "servProvCode",
				"parameterType": "OUT",
				"property": "SERV_PROV_CODE",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "transSeqNbr",
				"parameterType": "OUT",
				"property": "TRANS_SEQ_NBR",
				"type": "INTEGER"
			}, {
				"source": "RESULT",
				"name": "acctSeqNbr",
				"parameterType": "OUT",
				"property": "ACCT_SEQ_NBR",
				"type": "INTEGER"
			}, {
				"source": "RESULT",
				"name": "clientSeqNbr",
				"parameterType": "OUT",
				"property": "CLIENT_SEQ_NBR",
				"type": "INTEGER"
			}, {
				"source": "RESULT",
				"name": "totalFee",
				"parameterType": "OUT",
				"property": "TOTAL_FEE",
				"type": "INTEGER"
			}, {
				"source": "RESULT",
				"name": "feeType",
				"parameterType": "OUT",
				"property": "FEE_TYPE",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "userID",
				"parameterType": "OUT",
				"property": "REC_FUL_NAM",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "status",
				"parameterType": "OUT",
				"property": "STATUS",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "procTransID",
				"parameterType": "OUT",
				"property": "PROC_TRANS_ID",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "procResult",
				"parameterType": "OUT",
				"property": "PROC_RESULT",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "authorizationCode",
				"parameterType": "OUT",
				"property": "AUTH_CODE",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "transType",
				"parameterType": "OUT",
				"property": "TRANS_TYPE",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "ccType",
				"parameterType": "OUT",
				"property": "CC_TYPE",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "ccNumber",
				"parameterType": "OUT",
				"property": "CC_NUMBER",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "entityID",
				"parameterType": "OUT",
				"property": "ENTITY_ID",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "batchTransactionNbr",
				"parameterType": "OUT",
				"property": "BATCH_TRANSACTION_NBR",
				"type": "INTEGER"
			}]
		},
		"parameters": {
			"list": [{
				"source": "RESULT",
				"name": "SERVPROVCODE",
				"parameterType": "IN",
				"property": "servProvCode",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "USERID",
				"parameterType": "IN",
				"property": "userID",
				"type": "STRING"
			}, {
				"source": "RESULT",
				"name": "BATCHTRANSACTIONNBR",
				"parameterType": "IN",
				"property": "batchTransactionNbr",
				"type": "INTEGER"
			}, {
				"source": "RESULT",
				"name": "SP_CURSOR",
				"parameterType": "OUT",
				"property": "SP_CURSOR",
				"type": "RESULT_SET"
			}]
		}
	}
};

var procedureConfiguration = {
		connectionInfoSC : "DB_CONNECTION_INFO",
	    "queryResultSet": {
	        "name": "ELP_SP_EPAY_ETRANS_QUERY",
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
               	                    "name": "transSeqNbr",
               	                    "parameterType": "OUT",
               	                    "property": "TRANS_SEQ_NBR",
               	                    "type": "INTEGER"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "acctSeqNbr",
               	                    "parameterType": "OUT",
               	                    "property": "ACCT_SEQ_NBR",
               	                    "type": "INTEGER"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "clientSeqNbr",
               	                    "parameterType": "OUT",
               	                    "property": "CLIENT_SEQ_NBR",
               	                    "type": "INTEGER"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "totalFee",
               	                    "parameterType": "OUT",
               	                    "property": "TOTAL_FEE",
               	                    "type": "INTEGER"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "feeType",
               	                    "parameterType": "OUT",
               	                    "property": "FEE_TYPE",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "userID",
               	                    "parameterType": "OUT",
               	                    "property": "REC_FUL_NAM",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "status",
               	                    "parameterType": "OUT",
               	                    "property": "STATUS",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "procTransID",
               	                    "parameterType": "OUT",
               	                    "property": "PROC_TRANS_ID",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "procResult",
               	                    "parameterType": "OUT",
               	                    "property": "PROC_RESULT",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "authorizationCode",
               	                    "parameterType": "OUT",
               	                    "property": "AUTH_CODE",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "transType",
               	                    "parameterType": "OUT",
               	                    "property": "TRANS_TYPE",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "ccType",
               	                    "parameterType": "OUT",
               	                    "property": "CC_TYPE",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "ccNumber",
               	                    "parameterType": "OUT",
               	                    "property": "CC_NUMBER",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "entityID",
               	                    "parameterType": "OUT",
               	                    "property": "ENTITY_ID",
               	                    "type": "STRING"
               	                },
               	                {
               	                    "source": "RESULT",
               	                    "name": "batchTransactionNbr",
               	                    "parameterType": "OUT",
               	                    "property": "BATCH_TRANSACTION_NBR",
               	                    "type": "INTEGER"
               	                }
               	            ]},
	        "parameters": {"list": [
	            {
	                "source": "RESULT",
	                "name": "SERVPROVCODE",
	                "parameterType": "IN",
	                "property": "servProvCode",
	                "type": "STRING"
	            },
	            {
	                "source": "RESULT",
	                "name": "USERID",
	                "parameterType": "IN",
	                "property": "userID",
	                "type": "STRING"
	            },
	            {
	                "source": "RESULT",
	                "name": "BATCHTRANSACTIONNBR",
	                "parameterType": "IN",
	                "property": "batchTransactionNbr",
	                "type": "INTEGER"
	            },
	            {
	                "source": "RESULT",
	                "name": "SP_CURSOR",
	                "parameterType": "OUT",
	                "property": "SP_CURSOR",
	                "type": "RESULT_SET"
	            }
	        ]}
	    },
	    "supplemental": [{
	        "tag": "ELP_VW_EPAY_TRANSACTION",
	        "procedure": {
	            "name": "ELP_VW_EPAY_TRANSACTION",
	            "resultSet": {"list": [
	                {
	                    "source": "RESULT",
	                    "name": "SERV_PROV_CODE",
	                    "parameterType": "OUT",
	                    "property": "SERV_PROV_CODE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TRANS_SEQ_NBR",
	                    "parameterType": "OUT",
	                    "property": "TRANS_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "ACCT_SEQ_NBR",
	                    "parameterType": "OUT",
	                    "property": "ACCT_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CLIENT_SEQ_NBR",
	                    "parameterType": "OUT",
	                    "property": "CLIENT_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TOTAL_FEE",
	                    "parameterType": "OUT",
	                    "property": "TOTAL_FEE",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "FEE_TYPE",
	                    "parameterType": "OUT",
	                    "property": "FEE_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "REC_FUL_NAM",
	                    "parameterType": "OUT",
	                    "property": "REC_FUL_NAM",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "STATUS",
	                    "parameterType": "OUT",
	                    "property": "STATUS",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "PROC_TRANS_ID",
	                    "parameterType": "OUT",
	                    "property": "PROC_TRANS_ID",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "PROC_RESULT",
	                    "parameterType": "OUT",
	                    "property": "PROC_RESULT",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "AUTH_CODE",
	                    "parameterType": "OUT",
	                    "property": "AUTH_CODE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TRANS_TYPE",
	                    "parameterType": "OUT",
	                    "property": "TRANS_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CC_TYPE",
	                    "parameterType": "OUT",
	                    "property": "CC_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CC_NUMBER",
	                    "parameterType": "OUT",
	                    "property": "CC_NUMBER",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "ENTITY_ID",
	                    "parameterType": "OUT",
	                    "property": "ENTITY_ID",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "BATCH_TRANSACTION_NBR",
	                    "parameterType": "OUT",
	                    "property": "BATCH_TRANSACTION_NBR",
	                    "type": "INTEGER"
	                }
	            ]},
	            "parameters": {"list": [
	                {
	                    "source": "RESULT",
	                    "name": "SERV_PROV_CODE",
	                    "parameterType": "IN",
	                    "property": "SERV_PROV_CODE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TRANS_SEQ_NBR",
	                    "parameterType": "IN",
	                    "property": "TRANS_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "ACCT_SEQ_NBR",
	                    "parameterType": "IN",
	                    "property": "ACCT_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CLIENT_SEQ_NBR",
	                    "parameterType": "IN",
	                    "property": "CLIENT_SEQ_NBR",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TOTAL_FEE",
	                    "parameterType": "IN",
	                    "property": "TOTAL_FEE",
	                    "type": "INTEGER"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "FEE_TYPE",
	                    "parameterType": "IN",
	                    "property": "FEE_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "REC_FUL_NAM",
	                    "parameterType": "IN",
	                    "property": "REC_FUL_NAM",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "STATUS",
	                    "parameterType": "IN",
	                    "property": "STATUS",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "PROC_TRANS_ID",
	                    "parameterType": "IN",
	                    "property": "PROC_TRANS_ID",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "PROC_RESULT",
	                    "parameterType": "IN",
	                    "property": "PROC_RESULT",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "AUTH_CODE",
	                    "parameterType": "IN",
	                    "property": "AUTH_CODE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "TRANS_TYPE",
	                    "parameterType": "IN",
	                    "property": "TRANS_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CC_TYPE",
	                    "parameterType": "IN",
	                    "property": "CC_TYPE",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "CC_NUMBER",
	                    "parameterType": "IN",
	                    "property": "CC_NUMBER",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "ENTITY_ID",
	                    "parameterType": "IN",
	                    "property": "ENTITY_ID",
	                    "type": "STRING"
	                },
	                {
	                    "source": "RESULT",
	                    "name": "BATCH_TRANSACTION_NBR",
	                    "parameterType": "IN",
	                    "property": "BATCH_TRANSACTION_NBR",
	                    "type": "INTEGER"
	                }
	            ]}
	        }
	    }]		
};



try {

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
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}


	var connectionStandardChoice = getDBConnectionInfo(procedureConfiguration.connectionInfoSC);
	if (connectionStandardChoice == null) {
		var message = "Cannot find Connection Information Standard Choice: " + procedureConfiguration.connectionInfoSC;
	    returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
	    ELPLogging.fatal(returnException.toString());
	    throw returnException;		
	}
    //Create a connection to the Staging Table Database
    var databaseConnection = DBUtils.connectDB(connectionStandardChoice.connectionInfo);
	/**
	 * Obtain Stored Procedure for queryepayETransaction into Staging Table
	 */
	var epayETransactionProcedure = null;
	if (procedureConfiguration.queryResultSet == null) {
	    returnException = new ELPAccelaEMSEException("No QueryResultSet configuration " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
	    ELPLogging.fatal(returnException.toString());
	    throw returnException;
	}	
	var epayETransactionProcedure = new StoredProcedure(procedureConfiguration.queryResultSet, databaseConnection); 	


/**
 * 
*/
	try {

		ELPLogging.debug("Parameters from EPay Adapter:");
		ELPLogging.debug("	staticParameters       : " + aa.env.getValue("staticParameters"));
		ELPLogging.debug("	batchApplicationResult : " + aa.env.getValue("batchApplicationResult"));

		var batchApplicationResult = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));
		var stagingConfiguration = {};
		var dynamicParameters = {};
		var staticParameters = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));

	} catch (ex if ex instanceof SyntaxError){
		var returnException = new ELPAccelaEMSEException("Input Parameter parsing error " + ex.message, ScriptReturnCodes.INPUT_PARAMETER);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	} catch (ex) {
		var returnException = new ELPAccelaEMSEException("Other Input error " + ex.message, ScriptReturnCodes.INPUT_PARAMETER);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}



/**
 * The ETransaction Query procedure returns a ResultSet of ETransaction records for a Batch Transaction Number
 */
	epayETransactionProcedure.prepareStatement();
	var inputParameters = epayETransactionProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	epayETransactionProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("inputParameters for Query", inputParameters);

	// POC
	var dataSet = getStgRecords(inputParameters);

	// POC	
	// epayETransactionProcedure.setParameters(inputParameters);
	// var dataSet = epayETransactionProcedure.queryProcedure();
	var eTransactions = [];
	for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
		try {
			ELPLogging.debug("query Result ", queryResult);
			eTransactions.push(queryResult);
		} catch (ex) {
			ELPLogging.error("Exception processing row", ex);	
			ELPLogging.error("Unable to process row", queryResult);
		}
	}
} catch (ex if ex instanceof StoredProcedureException) {
    ELPLogging.fatal("Other Exception abort",ex);	
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
	aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY aborted with " + ex.message);
} catch (ex if ex instanceof JavaException) {
    ELPLogging.fatal("Other Exception abort",ex);	
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
	aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY aborted with " + ex.message);
} catch (ex if ex instanceof ELPAccelaEMSEException) { 
	// if Exception here then Batch Script aborted at some point
	// set result codes
	ELPLogging.fatal("ELPAccelaEMSEException abort",ex);
	aa.env.setValue("EMSEReturnCode", ex.getReturnCode());
	aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY aborted with " + ex.message);
} catch(ex ) { 
	// if Exception here then Batch Script aborted at some point
	// set result codes
    ELPLogging.fatal("Other Exception abort",ex);
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
	aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY aborted with " + ex.message);
} finally {
	if (dataSet != null) {
		dataSet.close();
	}
	if (epayETransactionProcedure != null) {
		epayETransactionProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}	
	if (!ELPLogging.isFatal()) {	// if fatal then return code already filled in
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY completed with " + ELPLogging.getErrorCount() + " errors.");					
		} else {
			aa.env.setValue("EMSEReturnMessage", "ELP_EMSE_EPAY_TRANSACTION_QUERY completed with no errors.");			
		}

	}
	if (batchApplicationResult != null) {	
		aa.env.setValue("batchApplicationResult", JSON.stringify(batchApplicationResult));
		if (eTransactions != null) {
			aa.env.setValue("eTransactions", JSON.stringify(eTransactions));			
		}
		ELPLogging.debug(JSON.stringify(batchApplicationResult));
		if (batchApplicationResult.returnLog) {
			aa.env.setValue("logFile", ELPLogging.toJSON());
		}
	}
	aa.env.setValue("ScriptReturnCode", "0"); 		
    aa.print(ELPLogging.toString());
	
}

// POC
/**
 * @description Query records from the staging table and returns a DataSet
 * @param  {array} parameters
 * @return {DataSet} DataSet object
 */
function getStgRecords(parameters) {
	var dataSet = null;
	try {

		if (parameters.servProvCode == null || parameters.userID == null || parameters.batchTransactionNbr == 0) {
			ELPLogging.error("**WARN: Cannot have null or 0 values in parameters.");
			return null;
		}

		var stmt = null;
		var sql = "select * from " + parameters["tableName"]
		sql += " WHERE SERV_PROV_CODE = ? and REC_FUL_NAM = ? and BATCH_TRANSACTION_NBR = ?";
		stmt = dbConn.prepareStatement(sql);
		stmt.setString(1, parameters["servProvCode"]);
		stmt.setString(2, parameters["userID"]);
		stmt.setNumber(3, parameters["batchTransactionNbr"]);

		var rs = stmt.executeQuery();

		var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
		var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

		dataSet = ds;

	} catch (ex) {
		ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
	}
	return dataSet;
}
