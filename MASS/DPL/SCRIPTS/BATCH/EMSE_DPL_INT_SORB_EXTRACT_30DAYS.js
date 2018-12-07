/*********************************************************************************************************************
* The purpose of this script is to extract records from the Accela DB for SORB verification. The script will         *
* retrive License records once in a 30 day period. It will extract all License Records and insert into staging table *
* based on Record and contact types.                                                                                 *
*                                                                                                                    *
* @author Manoj Parlikar 11/08/15                                                                                     *
*********************************************************************************************************************/
var errorCount = 0;
try
{
    try
    {
        //Import the utility script which contains functions that will be used later
        var SCRIPT_VERSION = 2.0
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
        var returnException;
        //showDebug = 3;
        logDebug("Finished loading the external scripts");
    }
    catch(ex)
    {
        logDebug("Error Loading Scripts " + ex.message);
        errorCount++;
    } 
    
   // var capContactArray =  new Array();
    var queryAccelaTag = "queryLicenseRenewals";
   // var insertTag = "insert";
    var queryToStg = "query";
    var stagingConfigurationString = '{\
    "connectionSC": "SORB30DAYS_JSON_OBJ",\
        "supplemental":   [{\
                "tag":"queryLicenseRenewals",\
            "procedure":{\
                  "name":"ELP_SORB_30_SP",\
				  "parameters":{"list":[\
                                   {"source":"RESULT","name":"ERROR_FLAG","parameterType":"OUT","property":"ERROR_FLAG","type":"STRING"}]},\
                  }},\
    {"tag":"query",\
                "procedure":{\
                    "name":"SORB_30_ERROR_QUERY",\
                    "resultSet":{"list":[\
                                   {"source":"RESULT","name":"ERROR_MESSAGE","parameterType":"OUT","property":"ERROR_MESSAGE","type":"STRING"}]},\
                  "parameters":{"list":[\
                                   {"source":"RESULT","name":"sp_cursor","parameterType":"OUT","property":"sp_cursor","type":"RESULT_SET"}]}}}],\
    }';
        
    try
    {
        // Create the connection object.
        var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

        var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
        this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
        logDebug("ConnectionInfo", dbConfiguration.connectionInfo);

        // Create a connection to the Staging Table Database
        var dbConn = DBUtils.connectDB(stagingConfiguration.connectionInfo);
    }
    catch(ex)
    {
        logDebug("Error Connecting to Staging Table Database " + ex.message);
        errorCount++;
    }
    
    //Create the global variables that will be used throughout the script
    var HOUR_SEC = (60 * 60);

	
	// Start : Code to send email 
	var senderEmailAddr = "noreply@dpl.state.ma.us";
	var batchJobName = aa.env.getValue("BatchJobName");
	var emailAddress = ""; // Add all text that you want to send in the email to this string variable

	var emailAddress = lookup("BATCH_STATUS_EMAIL", "SORB 30DAYS"); // This email will be set by standard choice


	var emailAddress2= aa.env.getValue("emailAddress"); // This will be secondary email set by batch job param
	
	aa.print("batchJobName : --- " + batchJobName + "  Email : " + emailAddress2);
	if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
	{
		emailAddress2="";
	}
	// End : Code to send email
  
    
    var timer = new ELPTimer(HOUR_SEC);
    logDebug("Timer Started");
    logDebug("Finished creating global variables");
    
    try
    {
        var emseQueryParameters;
        
        // Call the stored procedure to load the staging table with License records
        var dataSetLicenseRecord = callToStoredProcedure(emseQueryParameters, queryAccelaTag);
    }
    catch(ex)
    {
        logDebug("Error Getting Records from Accela Database. : "+ex.toString());
        errorCount++;
    }
    
	try
	{
		// Retrive the error messages logged-in for License records in current execution.
		var emseQueryParameters;
		var dataSetErrorRecord = callToStoredProcedure(emseQueryParameters, queryToStg);
	}
	catch (ex)
	{
		logDebug("Error Getting Records from Accela Database. : "+ex.toString());
        errorCount++;
	}
    
    while((queryAccelaResult=dataSetErrorRecord.next()))
    {
        
		logDebug (queryAccelaResult.ERROR_MESSAGE);
       
    }
}
catch(ex)
{
    logDebug("Error Reading the DataSet Object "+ex.toString());
	errorCount++;
}
finally
{
    if (!errorCount)
    {
        logDebug("EMSE_DPL_INT_SORB_EXTRACT completed"); 
        aa.env.setValue("ScriptReturnCode", "0");
    }
    else
    {
        logDebug("EMSE_DPL_INT_SORB_EXTRACT completed with " + errorCount + " errors"); 
        aa.env.setValue("ScriptReturnCode", "1");
    }
    
	if (dbConn)
	{
		dbConn.close();
	}
	
    if (showDebug)	aa.env.setValue("ScriptReturnMessage", debug);
	
	if (emailAddress && emailAddress != "" && emailAddress.length > 0 )
	{
		aa.sendMail(senderEmailAddr, emailAddress, emailAddress2, "Result: " + batchJobName, debug);
	}
}

/** 
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name 
 * @throws  N/A
 */
function getScriptText(vScriptName)
{
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
    return emseScript.getScriptText() + "";
}

/** 
 * @desc This method creates the DB connection and execute the stored procedure
 * @param {emseQueryParameters} emseQueryParameters - Input parameters
 * @param {queryTag} queryTag - Stored procedure name. 
 */
function callToStoredProcedure(emseQueryParameters, queryTag)
{
	try
	{
		for (var stgObjIterator = 0; stgObjIterator < stagingConfiguration.supplemental.length; stgObjIterator ++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[stgObjIterator];
	
			if (supplementalConfiguration.tag == queryTag)
			{
				var licenseRecords = new StoredProcedure(supplementalConfiguration.procedure, dbConn);
				break;
			}
		}
	
		if (licenseRecords == null)
		{
			var message = "Cannot find procedure queryLicenseRenewals";
			var exception = new Error(message);
			throw exception;
		}
		
		var staticParameters ={};
		var dynamicParameters ={};
		var batchApplicationResult ={};
		
		licenseRecords.spCall = "{ CALL " + licenseRecords.procedure.name + " ";
		
		// add the parameter place holders
		// there is always an out parameter first for the update count
		if ((licenseRecords.procedure.parameters != null) && 
			licenseRecords.procedure.parameters.list.length > 0 && licenseRecords.procedure.parameters != undefined)
		{
			var placeHolders = "";
	
			var parameters = licenseRecords.procedure.parameters.list;
	
			for (i = 0; i < parameters.length; i++)
			{
				if (placeHolders.length == 0)
				{
					placeHolders =  placeHolders + "(?";
				}
			else
			{
				placeHolders = placeHolders + ", ?";
			}
		}
		
		placeHolders += ") ";
		
		licenseRecords.spCall += placeHolders;
		}
		else
		{
			var placeHolders = "";
			placeHolders =  placeHolders + "(?";     // count out parameter
			placeHolders += ") ";
			licenseRecords.spCall += placeHolders;                
		}
	
		licenseRecords.spCall += "}";
		licenseRecords.statement = licenseRecords.dbConnection.prepareCall(licenseRecords.spCall);
	
		var inputParameters = licenseRecords.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		licenseRecords.copyEMSEParameters(emseQueryParameters, inputParameters);
	
		licenseRecords.setParameters(inputParameters);
		var dataSetResult = licenseRecords.queryProcedure();
	
		licenseRecords.close();
		return dataSetResult;
	}
	catch (ex)
	{
		licenseRecords.close();
		logDebug("Error "+ex.toString());
	}
}