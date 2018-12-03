  try
    {   
        //Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 2.0
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"))
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
        var returnException;
        logDebug("Finished loading the external scripts");
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }

// POC
var selectQueryObj = {
    "akaInfoQuery": {
        "table": "G7CONTACT_AKA_INFO",
        "resultSet": {
            "list": [{
                "source": "RESULT",
                "name": "G7_LNAME",
                "parameterType": "OUT",
                "property": "G7_LNAME",
                "type": "STRING"
            }]
        },
        "parameters": {
            "list": [{
                "source": "RESULT",
                "name": "contactSeqNbr",
                "parameterType": "IN",
                "property": "contactSeqNbr",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "serviceProviderCode",
                "parameterType": "IN",
                "property": "serviceProviderCode",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "SP_CURSOR",
                "parameterType": "OUT",
                "property": "SP_CURSOR",
                "type": "RESULT_SET"
            }]
        }

    },
    "selectQuery": {
        "table": "DOR_LICENSE_EXTRACT",
        "resultSet": {
            "list": [{
                "source": "RESULT",
                "name": "B1_PER_ID1",
                "parameterType": "OUT",
                "property": "B1_PER_ID1",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "B1_PER_ID2",
                "parameterType": "OUT",
                "property": "B1_PER_ID2",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "B1_PER_ID3",
                "parameterType": "OUT",
                "property": "B1_PER_ID3",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "EXPIRATION_DATE",
                "parameterType": "OUT",
                "property": "EXPIRATION_DATE",
                "type": "DATE"
            }, {
                "source": "RESULT",
                "name": "EXPIRATION_INTERVAL_UNITS",
                "parameterType": "OUT",
                "property": "EXPIRATION_INTERVAL_UNITS",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "EXPIRATION_INTERVAL",
                "parameterType": "OUT",
                "property": "EXPIRATION_INTERVAL",
                "type": "STRING"
            }]
        },
        "parameters": {
            "list": [{
                "source": "RESULT",
                "name": "startDate",
                "parameterType": "IN",
                "property": "startDate",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "endDate",
                "parameterType": "IN",
                "property": "endDate",
                "type": "STRING"
            }, {
                "source": "RESULT",
                "name": "sp_Cursor",
                "parameterType": "OUT",
                "property": "sp_Cursor",
                "type": "RESULT_SET"
            }]
        }
    }
};

	var stagingConfiguration = '{\
    "connectionSC": "SORB30DAYS_JSON_OBJ",\
        "supplemental":   [\
    {"tag":"LicenseExtract",\
                "procedure":{\
                    "name":"ELP_DOR_LICENSE_EXTRACT_SP",\
                    "resultSet":{"list":[\
                                   {"source":"RESULT","name":"B1_PER_ID1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
								   {"source":"RESULT","name":"B1_PER_ID2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
								   {"source":"RESULT","name":"B1_PER_ID3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
								   {"source":"RESULT","name":"EXPIRATION_DATE","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"},\
								    {"source":"RESULT","name":"EXPIRATION_INTERVAL_UNITS","parameterType":"OUT","property":"EXPIRATION_INTERVAL_UNITS","type":"STRING"},\
								   {"source":"RESULT","name":"EXPIRATION_INTERVAL","parameterType":"OUT","property":"EXPIRATION_INTERVAL","type":"STRING"}]},\
                  "parameters":{"list":[\
                                   {"source":"RESULT","name":"startDate","parameterType":"IN","property":"startDate","type":"STRING"},\
								   {"source":"RESULT","name":"endDate","parameterType":"IN","property":"endDate","type":"STRING"},\
								   {"source":"RESULT","name":"sp_Cursor","parameterType":"OUT","property":"sp_Cursor","type":"RESULT_SET"}]}}},\
	        {\
	            "tag": "stagingAKAInfo",\
	            "procedure": {\
	                "name": "ELP_SP_DOR_INT_STG_AKA_INFO",\
	                "resultSet": {"list": [{ "source": "RESULT", "name": "G7_LNAME", "parameterType": "OUT", "property": "G7_LNAME", "type": "STRING"   }]},\
	                "parameters": {"list": [{\
	                        "source": "RESULT",\
	                        "name": "contactSeqNbr",\
	                        "parameterType": "IN",\
	                        "property": "contactSeqNbr",\
	                        "type": "STRING"\
	                    },\
	                    {\
	                        "source": "RESULT",\
	                        "name": "serviceProviderCode",\
	                        "parameterType": "IN",\
	                        "property": "serviceProviderCode",\
	                        "type": "STRING"\
	                    },\
	                    {\
	                        "source": "RESULT",\
	                        "name": "SP_CURSOR",\
	                        "parameterType": "OUT",\
	                        "property": "SP_CURSOR",\
	                        "type": "RESULT_SET"\
	                    }]}\
	            }\
	        },\
	   { "tag": "insert",\
	            "procedure": {\
	        "name": "ELP_SP_DOR_DPL_INT_STG_INSERT",\
	        "resultSet": {"list": []},	        \
	        "parameters": {"list": [\
	            {\
	                "source": "RESULT",\
	                "name": "ssn",\
	                "parameterType": "IN",\
	                "property": "ssn",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "firstName",\
	                "parameterType": "IN",\
	                "property": "firstName",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "middleInit",\
	                "parameterType": "IN",\
	                "property": "middleInit",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "lastName",\
	                "parameterType": "IN",\
	                "property": "lastName",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "generation",\
	                "parameterType": "IN",\
	                "property": "generation",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "maidenName",\
	                "parameterType": "IN",\
	                "property": "maidenName",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "addressLine1",\
	                "parameterType": "IN",\
	                "property": "addressLine1",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "addressLine2",\
	                "parameterType": "IN",\
	                "property": "addressLine2",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "city",\
	                "parameterType": "IN",\
	                "property": "city",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "state",\
	                "parameterType": "IN",\
	                "property": "state",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "zipCode",\
	                "parameterType": "IN",\
	                "property": "zipCode",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "fId",\
	                "parameterType": "IN",\
	                "property": "fId",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessName",\
	                "parameterType": "IN",\
	                "property": "businessName",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessAddressLine1",\
	                "parameterType": "IN",\
	                "property": "businessAddressLine1",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessAddressLine2",\
	                "parameterType": "IN",\
	                "property": "businessAddressLine2",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessCity",\
	                "parameterType": "IN",\
	                "property": "businessCity",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessState",\
	                "parameterType": "IN",\
	                "property": "businessState",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "businessZipCode",\
	                "parameterType": "IN",\
	                "property": "businessZipCode",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "boardCode",\
	                "parameterType": "IN",\
	                "property": "boardCode",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "licenseNumber",\
	                "parameterType": "INOUT",\
	                "property": "licenseNumber",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "typeClass",\
	                "parameterType": "IN",\
	                "property": "typeClass",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "issueDate",\
	                "parameterType": "IN",\
	                "property": "issueDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "licenseExpDate",\
	                "parameterType": "IN",\
	                "property": "licenseExpDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "eligibilityDate",\
	                "parameterType": "IN",\
	                "property": "eligibilityDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "statusCode",\
	                "parameterType": "IN",\
	                "property": "statusCode",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "entityType",\
	                "parameterType": "IN",\
	                "property": "entityType",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "agency",\
	                "parameterType": "IN",\
	                "property": "agency",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "startingExpDate",\
	                "parameterType": "IN",\
	                "property": "startingExpDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "endingExpDate",\
	                "parameterType": "IN",\
	                "property": "endingExpDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "extractStatus",\
	                "parameterType": "IN",\
	                "property": "extractStatus",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "runDate",\
	                "parameterType": "IN",\
	                "property": "runDate",\
	                "type": "DATE"\
	            },\
	            {\
	                "source": "STATIC",\
	                "name": "batchInterfaceName",\
	                "parameterType": "IN",\
	                "property": "batchInterfaceName",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "STATIC",\
	                "name": "serviceProviderCode",\
	                "parameterType": "IN",\
	                "property": "serviceProviderCode",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "STATIC",\
	                "name": "transactionGroup",\
	                "parameterType": "IN",\
	                "property": "transactionGroup",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "accelaId",\
	                "parameterType": "IN",\
	                "property": "accelaId",\
	                "type": "STRING"\
	            },\
	            {\
	                "source": "RESULT",\
	                "name": "recordId",\
	                "parameterType": "IN",\
	                "property": "recordId",\
	                "type": "STRING"\
	            }\
	        ]}\
	    }}\
		],\
    }';
	 try
    {
        // Create the connection object.
        var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfiguration);

        var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
		aa.print("stagingConfiguration.connectionSC--" + stagingConfiguration.connectionSC);
        this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
        //aa.print("ConnectionInfo", dbConfiguration.connectionInfo);

        // Create a connection to the Staging Table Database
        var dbConn = DBUtils.connectDB(stagingConfiguration.connectionInfo);
    }
    catch(ex)
    {
        logDebug("Error Connecting to Staging Table Database " + ex.message);
        //errorCount++;
    }
	
	
	function getScriptText(vScriptName)
{
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
    return emseScript.getScriptText()+"";
}

 var stdChoiceLicType = "DOR_DPL_EXCLUDE_LIC_TYPE";
    var stdChoiceLicStatus = "DOR_DPL_LICENSE_STATUS";

    // Load the license type and license status standard choice
    var stdChoiceLicTypeArry = getSharedDropDownDescriptionList(stdChoiceLicType);
    var stdChoiceLicStatusArry  = getSharedDropDownDescriptionList(stdChoiceLicStatus);
    var ContactTypes = ["INDIVIDUAL","BUSINESS"];       
    
	var days = 0;
	
    var todaysDate = new Date();
	var batchRunDate = new Date();
	////Set the date range to 6 month from today
	todaysDate.setMonth(todaysDate.getMonth() + 6); 
	
	var dayOfMonth = 1 + days;
	
	//get the first day of the Month;
	var startingWeekExpDate = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), dayOfMonth);
	//get the last day of the Month;
	var endingWeekExpDate = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), dayOfMonth +7);
	
	var startingExpDateStr = jsDateToMMDDYYYY(startingWeekExpDate);
	var endingExpDateStr = jsDateToMMDDYYYY(endingWeekExpDate);
	
	//get the first day of the Month;
	var startingExpDate = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), 1);
	//get the last day of the Month;
	var endingExpDate = new Date(todaysDate.getFullYear(), todaysDate.getMonth() + 1, 0);

	// POC
    var emseQueryParameters = {
        "startDate": startingExpDateStr,
        "endDate": endingExpDateStr,
        "tableName": selectQueryObj.selectQuery.table
    };

    // Call the stored procedure to load the staging table with License records
    var dataSetLicenseRecord = getStgRecords(emseQueryParameters);

    // POC
		// var emseQueryParameters = {"startDate" : startingExpDateStr, "endDate" : endingExpDateStr};
        
  //       // Call the stored procedure to load the staging table with License records
  //       var dataSetLicenseRecord = callToStoredProcedure(emseQueryParameters, "LicenseExtract");
		
		if (dataSetLicenseRecord)
		{
		while((queryForDBFields = dataSetLicenseRecord.next()) != null)
        {
            try
            {
                //var capID = capListLic[thisCAP].getCapID();
                var capIDModel = aa.cap.getCapID(queryForDBFields.B1_PER_ID1,queryForDBFields.B1_PER_ID2,queryForDBFields.B1_PER_ID3).getOutput();
               // var licenseExpDate = capListLic[thisCAP].getExpDate();
                //var licenseExpUnit = capListLic[thisCAP].getExpUnit();
                //var licenseExpInterval = capListLic[thisCAP].getExpInterval();
				aa.print(jsDateToMMDDYYYY(new Date(Date.parse(queryForDBFields.EXPIRATION_DATE))));
                var eligibilityDate = new Date(getEligibilityDate(new Date (jsDateToMMDDYYYY(new Date(Date.parse(queryForDBFields.EXPIRATION_DATE)))),queryForDBFields.EXPIRATION_INTERVAL_UNITS,queryForDBFields.EXPIRATION_INTERVAL));
                
                // Created an object that will contain license related details.
                var licenseDetailsObj = {"licenseExpDate":queryForDBFields.EXPIRATION_DATE,"eligibilityDate":eligibilityDate,"issueDate":""}
				
                logDebug("All caps : "+ capIDModel + "--->" + eligibilityDate);
               
				evaluateCap(capIDModel,licenseDetailsObj);
                logDebug("Finished Evaluating each CAP");
				 //break;
            }
            catch(ex if ex instanceof StoredProcedureException)
            {
                logDebug("StoredProcedureException Occured when trying to insert record "+capIDModel+": "+ex.toString());
            }
            catch(ex)
            {
                logDebug("Error processing Cap ID :  "+capIDModel+": "+ex.toString());
            }
			//break;
        }}
		
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
			//aa.print("queryTag---- " + queryTag);
			//return;
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
function getEligibilityDate(licenseExpDate,licenseExpUnit,licenseExpInterval)
{
    var eligibledt="";
    try
    {
        if(licenseExpInterval !="" && licenseExpUnit !="")
        {
			aa.print(licenseExpDate.getMonth());
				aa.print(licenseExpDate.getYear());
            if("YEARS"==licenseExpUnit.toUpperCase())
            {
				
                var expdt = licenseExpDate;//new Date(licenseExpDate.getMonth()+"/"+licenseExpDate.getDayOfMonth()+"/"+licenseExpDate.getYear());
                eligibledt = expdt.setFullYear(expdt.getFullYear()-parseInt(licenseExpInterval));
            }
            if("MONTHS"==licenseExpUnit.toUpperCase())
            {
                var expdt = licenseExpDate;//new Date(licenseExpDate.getMonth()+"/"+licenseExpDate.getDayOfMonth()+"/"+licenseExpDate.getYear());
                eligibledt = expdt.setMonth(expdt.getMonth()-parseInt(licenseExpInterval));
            }
        }
    }
    catch(ex)
    {
        logDebug("Error Evaluating the Eligibility Date :"+ex.toString());
    }
    
    return eligibledt;
}

function evaluateCap(capIDModel,licenseDetailsObj)
{
	aa.print("evaluateCap -- ?");
    var capModelResult = aa.cap.getCap(capIDModel);
    
    if(capModelResult.getSuccess())
    {
        var capModel = capModelResult.getOutput();
		aa.print(capModel);
		
    }
    
    if(capModel)
    {
        var capType = capModel.getCapType();
		var categoryType = capType.getType();
		
        var capStatus = capModel.getCapStatus();
        var projSpecialTxt = capModel.getSpecialText();
		
		var model = capModel.getCapModel(); // get Model
		var capTypeAlias = model.getAppTypeAlias(); // Used to determine License type as Individual or Business
		
        logDebug("capTypeAlias : ----" + capTypeAlias+" : for capId: "+capIDModel+"   and categoryType:----"+categoryType)
		
		var processRecordFlag = true;
		
		var customID = capIDModel.getCustomID();
		aa.print("customID : " +customID);
		
		var scanner = new Scanner(customID,"-");
		var licenseNumber = scanner.next();
		var boardCode = scanner.next();
		var typeClass = scanner.next();
		
		var boardTypeclass = boardCode + "-" +typeClass;
		
		
		if (exists(boardTypeclass,stdChoiceLicTypeArry) || exists(boardCode,stdChoiceLicTypeArry))
		{
			logDebug("Processed record False.");
			processRecordFlag = false;
		}
		
        if(processRecordFlag)
        {
            if(exists(capStatus,stdChoiceLicStatusArry))
            {
                if(capTypeAlias != null)
                {
                    var licType = evaluateLicType(capTypeAlias);
					logDebug("Finished evaluating the license type :"+ licType +" based on Special Text : "+capTypeAlias);    		
                }
                else
                {
                    var returnException = new ELPAccelaEMSEException("Special Text is NULL for CAP ID  :" + capIDModel);
                    logDebug(returnException.toString());
                    throw returnException;
                }
                
                //Assigning issued date to licenseDetailsObj
                var fileDate = capModel.getFileDate();
                licenseDetailsObj.issueDate = new Date(fileDate.getMonth()+"/"+fileDate.getDayOfMonth()+"/"+fileDate.getYear());
                
                //get License Record
                var licenseDetailsArray = evaluateLicense(licenseDetailsObj,capIDModel,categoryType,licType);
                
                if (licenseDetailsArray["statusCode"] == null)
                {
                    licenseDetailsArray["statusCode"] = getRecordStatusCode(capStatus);
                }
                
                // Retrieve CapContactct Details for each capId
                var capContactResult = aa.people.getCapContactByCapID(capIDModel);
                
                if(capContactResult.getSuccess())
                {
                    var capContactArray = capContactResult.getOutput();
                    
                    if(capContactArray)
                    {
						logDebug("Finished Retrieving the CapContactct Details for capId :"+ capIDModel);
						
                        var contactInfoArray =  new Array();
                        var addressArray = new Array();
                        var loopFlag = false;
                        
                        for(capContactIndex in capContactArray)
                        {
                            try
                            {
                                
                                //Retrieve the contact information, insert the record into the staging table.
                                var capContactType = capContactArray[capContactIndex].getPeople().getContactType();
                                logDebug("capContactType =  "+capContactType);
								
                                //check if cap contact type is Individual or Business
                                // It is assumed except Business all other contacts types are Individual                                    
                                if (licType == "INDIVIDUAL")
                                {
                                    logDebug("INDIVIDUAL ----- ");
                                    if("BUSINESS" == capContactType.toUpperCase())
                                    {
                                        capContactType = "BUSINESS";
                                        loopFlag = true;
                                    }
                                    else if("LICENSED INDIVIDUAL" == capContactType.toUpperCase())
                                    {
                                        capContactType = "INDIVIDUAL";                                        
                                    }
                                }
                                else
                                {
                                    logDebug("BUSINESS ----- ");
                                    if("BUSINESS" == capContactType.toUpperCase())
                                    {
                                        capContactType = "BUSINESS";
                                    }
                                    else if("LICENSED INDIVIDUAL" == capContactType.toUpperCase())
                                    {
                                        capContactType = "INDIVIDUAL";
                                        loopFlag = true;
                                    }
                                }
                                
                                if(exists(capContactType,ContactTypes))
								{
                                    var capContactValues = getContact(capContactIndex,capIDModel,capContactType,licenseDetailsObj,capContactArray,loopFlag, licType,contactInfoArray,addressArray);
                                    logDebug("About to Insert");
									//return;
                                }
                            }
                            catch(ex)
                            {
                                logDebug("Error Retrieving the Cap Contact Information for capID Model : "+capIDModel+" and Contact # " + capContactArray[capContactIndex].getPeople().getContactSeqNumber() +" : "+ex.toString());
                            }
                        }
                        
                        // Merge License and Contact Info into one Array
                        capContactValues = meargeArray(licenseDetailsArray,capContactValues);
                        if (capContactValues.entityType == "I") {
                        	if (validateIndividual(capContactValues)) {
                                logDebug("About to Insert Individual ---- "  + capIDModel);
                                callToStoredProcedure(capContactValues, "insert");                                     		
                        	} else {
                        		logDebug("ERROR Insert Staging, The ssn OR firstName OR lastName OR addressLine1 OR city OR state OR zipCode is Null: " + capIDModel);
                        	}
           	
                        } else if (capContactValues.entityType == "B") {
                        	if (validateBusiness(capContactValues)) {
                                logDebug("About to Insert Business ---- "  + capIDModel );
                               callToStoredProcedure(capContactValues, "insert");            		
                        	} else {
                        		logDebug("ERROR Insert Staging, The fID OR businessName OR businessAddressLine1 OR businessCity OR businessState OR businessZipCode is Null: " + capIDModel);
                        	}
                        	
                        } else {
                            logDebug("Error invalid entity type for capIDModel : "+capIDModel);                        	
                        }
            
			
                    }
                }
                else
                {
                    returnException = new ELPAccelaEMSEException("Error Retrieving Cap Contact for CAP "+capIDModel+": "+ capContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
                    logDebug(returnException.toString());
                }
            }
        }
    }
    else
    {
        logDebug("Error Retrieving CAP Model Info for capIDModel : "+capIDModel+ ": "+capModelResult.getErrorMessage());
    }
}

/**
 * @desc This method evaluates the license details and put them into one array.
 * @param {licenseDetailsObj} licenseDetailsObj - Contains License Details}
 * @param {capIDModel} capIDModel an Object - contains the cap id of the CAP record
 * @param {projSpecialTxt} projSpecialTxt a string - contains the Special Text for license record
 * @param {licType} licType - It determines the License type whether Individual or business
 * @returns {array of string} licenseArray - an array consisting of all of the license information
 */
var entityType="";
function evaluateLicense(licenseDetailsObj,capIDModel,categoryType,licType)
{
    if (licType == "INDIVIDUAL")
    {
        entityType = "I";
    }
    else{
        entityType = "B";
    }
    
    var licenseArray = new Array(); 
    var altId = capIDModel.getCustomID();
    
    var scanner = new Scanner(altId,"-");
    var licenseNumber = scanner.next(); 
     
	var boardCode = scanner.next();
	var typeClass = scanner.next();  
	logDebug("licenseNumber    :    "+licenseNumber +", boardCode    :    "+boardCode +", typeClass    :    "+typeClass);
    var licenseExpDate;// = licenseDetailsObj.licenseExpDate;
    licenseExpDate =licenseDetailsObj.licenseExpDate;// new Date(licenseExpDate.getMonth()+"/"+licenseExpDate.getDayOfMonth()+"/"+licenseExpDate.getYear());
    var licenseIssueDate = licenseDetailsObj.issueDate;
    var licenseEligibilityDate = licenseDetailsObj.eligibilityDate;

    var startingLicExpDate= startingExpDate;
    var endingLicExpDate = endingExpDate;   
    
    var statusCode = getStatusCode(capIDModel); 
    
    var agency = "DPL";
    var extractStatus = "EXTRACTED_EMSE";
    
    licenseArray["accelaId"] = capIDModel.toString();
    licenseArray["recordId"] = altId;
    
    licenseArray["entityType"] = entityType;
    licenseArray["boardCode"] = boardCode;
	
    licenseArray["licenseNumber"] = padWithLeadingZeros(licenseNumber);
    licenseArray["typeClass"] = typeClass;
    licenseArray["issueDate"] = licenseIssueDate;
    licenseArray["licenseExpDate"] = licenseExpDate;
    licenseArray["eligibilityDate"] = licenseEligibilityDate;
    licenseArray["statusCode"] = statusCode;
    licenseArray["agency"] = agency;
    licenseArray["startingExpDate"] = startingLicExpDate;
    licenseArray["endingExpDate"] = endingLicExpDate;
    licenseArray["extractStatus"] = extractStatus;
    licenseArray["runDate"] = batchRunDate;
	licenseArray["serviceProviderCode"] =  "DPL";
	licenseArray["transactionGroup"] = "DPL";
	licenseArray ["batchInterfaceName"] = "ELP.DOR.DPL.EXTRACT";

    return licenseArray;
    
}

/**
 * @desc This method retrieves the contact and address information of the primary contact in a CAP
 * @param {capIndex,capIDModel,capContactType,licenseDetailsObj,capContactArray, loopFlag, licType,contactInfoArray,addressArray}
 * @returns {array of string} contactAndAddrssDetails - an array consisting of all of the contact information
 */
function getContact(capIndex,capIDModel,capContactType,licenseDetailsObj,capContactArray,loopFlag, licType,contactInfoArray,addressArray)
{
    if(capContactArray)
    {   
        var ssnFlag = false;
        var SocialSecurityNbr;
        
        aa.print("Start : ----" );
        if ("INDIVIDUAL" == capContactType)
        {
            SocialSecurityNbr = capContactArray[capIndex].getPeople().getSocialSecurityNumber();
			ssnFlag = true;
        }
        else
        {
            SocialSecurityNbr = capContactArray[capIndex].getPeople().getFein();
        }
        
        aa.print("Start : ----" + SocialSecurityNbr);
        if (SocialSecurityNbr != null)
        {
            var SocialSecNbr;
			if("INDIVIDUAL" == capContactType)
			{
				//var SocialSecurityNbr = capContactArray[capIndex].getPeople().getSocialSecurityNumber();
				var scanner = new Scanner(SocialSecurityNbr,"-");
				SocialSecNbr = scanner.next()+scanner.next()+scanner.next();
				contactInfoArray["ssn"] = padWithLeadingZeros(SocialSecNbr); 
				if (!validateSSN(contactInfoArray["ssn"])) {
					contactInfoArray["ssn"] = null;
				}
			}
			
			if("BUSINESS" == capContactType)
			{
				var businessName = capContactArray[capIndex].getPeople().getBusinessName();
				contactInfoArray["businessName"] = businessName.substr(0, 49);
				var scanner = new Scanner(SocialSecurityNbr,"-");
				SocialSecNbr = scanner.next()+scanner.next();				
				contactInfoArray["fId"] = padWithLeadingZeros(SocialSecNbr);
				if (!validateSSN(contactInfoArray["fId"])) {
					contactInfoArray["fId"] = null;
				}				
			}
			logDebug("SSN/FID : ---- "+ capContactArray[capIndex].getPeople().getFirstName() + " ----- " + contactInfoArray["fId"] + "-----" + licType); 
        }
        
        
        if ("INDIVIDUAL" == capContactType)
        {
            var firstName = capContactArray[capIndex].getPeople().getFirstName();
            var middleInit = capContactArray[capIndex].getPeople().getMiddleName();
			
			if(middleInit != null)
				middleInit = middleInit.substring(0,1);
			
			logDebug("middleInit Value :  "+ middleInit); 
            var lastName = capContactArray[capIndex].getPeople().getLastName();
            
            var generation = capContactArray[capIndex].getPeople().getNamesuffix();
            var maidenName = "";
			var queryProcedure = null;
            if(ssnFlag)
            {
                
                for(var x = 0; x < stagingConfiguration.supplemental.length; x++)
                {
					
					var supplementalConfig = stagingConfiguration.supplemental[x];
					if(supplementalConfig.tag == "stagingAKAInfo")
					{
						queryProcedure = new StoredProcedure(supplementalConfig.procedure,dbConn);
						break;
					}						
                }
               
				   if(SocialSecurityNbr !=null && queryProcedure != null)
					{
						try{ 
							logDebug("Get Maiden Name by SocialSecurityNbr :"+SocialSecurityNbr);
							// POC
							var emseQueryParameters = {"contactSeqNbr":SocialSecurityNbr, "serviceProviderCode": "DPL"};
							var dataSetStg = getAKA_INFORecords(emseQueryParameters);

							// POC
							// var emseQueryParameters = {"contactSeqNbr":SocialSecurityNbr};
							// queryProcedure.prepareStatement();
							// var inputParameters = queryProcedure.prepareParameters(staticParamObj,dynamicParamObj,batchAppResultObj);
							// inputParameters = queryProcedure.copyEMSEParameters(emseQueryParameters,inputParameters);
							// queryProcedure.setParameters(inputParameters);
							
							// //Query for fetching the records from the view  
							// var dataSetStg = queryProcedure.queryProcedure();
							
							var dataSetList = null;
							if((dataSetList = dataSetStg.next()) != null)
							{
								if (dataSetList.g7_lname != null) {
									maidenName = dataSetList.g7_lname;									
								} else {
									maidenName = "";
								}

							}
							aa.print("Finished querying the values");
						}
						catch(ex if ex instanceof StoredProcedureException)
						{
							logDebug("StoredProcedureException Occured when trying to fetch maiden name for "+capIDModel+": "+ex.toString());
						}
						catch(ex)
						{
							logDebug("Maiden Name does not found for CapId "+ capIDModel +" :"+ex.toString());
						} finally {
							logDebug("Close Maiden Name query");							
							if (dataSetStg != null){
								dataSetStg.close();
							}
							queryProcedure.close();							
						}
					} 
            }
            
            //var maidenName = capContactArray[capIndex].getPeople().getPeopleAKAList();
            //place all values into array
            contactInfoArray["firstName"] = firstName.substr(0, 16);
            contactInfoArray["middleInit"] = middleInit;
            contactInfoArray["lastName"] = lastName.substr(0, 20);
            contactInfoArray["generation"] = generation;
            contactInfoArray["maidenName"] = maidenName.substr(0, 20);
            
        }
        //Retrieve address information
        var contactNumber = capContactArray[capIndex].getPeople().getContactSeqNumber();        
        var addressModelResult = getAddress(capIDModel,contactNumber,capContactType,addressArray);
        
        // Merge the contact and address details into one array
        contactAndAddrssDetails = meargeArray(contactInfoArray,addressModelResult);
    }
    return contactAndAddrssDetails;
}
 

/**
 * @desc This method is created to retrieve a address details based on capContact
 * @param {capIDModel,contactNumber,licType}
 * @returns {array of string} - contains the address details.
 */
function getAddress(capIDModel,contactNumber,capContactType,addressArray) 
{   
    
    var capContactModelList = aa.people.getCapContactByContactID(contactNumber).getOutput();
    var capContactModel = capContactModelList[0];
    var addressModelResult = aa.address.getContactAddressListByCapContact(capContactModel.getCapContactModel());
    
    if(addressModelResult.getSuccess())
    {
        var addressModelList = addressModelResult.getOutput();
    }
    if(addressModelList)
    {
        for(addressIndex in addressModelList)
        {
			
            if("INDIVIDUAL" == capContactType.toUpperCase()) 
            {
				if (addressModelList[addressIndex].getHouseNumberAlphaStart() != null) {
	                addressArray["addressLine1"] = String(addressModelList[addressIndex].getHouseNumberAlphaStart() + " " + addressModelList[addressIndex].getAddressLine1());	
	                addressArray["addressLine1"] = addressArray["addressLine1"].substr(0, 24);	                
				} else if (addressModelList[addressIndex].getAddressLine1() != null){
	                addressArray["addressLine1"] = String(addressModelList[addressIndex].getAddressLine1());
	                addressArray["addressLine1"] = addressArray["addressLine1"].substr(0, 24);	 	                
				}
                if (addressModelList[addressIndex].getAddressLine2() != null)
                {
                    addressArray["addressLine2"] = String(addressModelList[addressIndex].getAddressLine2());
                    addressArray["addressLine2"] = addressArray["addressLine2"].substr(0, 24);                    
                }


				logDebug("INDIVIDUAL address output addressArray[addressLine1] = "+ addressArray["addressLine1"]);
				logDebug("INDIVIDUAL address output addressArray[addressLine2] = "+ addressArray["addressLine2"]);
				
				var cityName = addressModelList[addressIndex].getCity();
				cityName = cityName.substr(0, 14);
                addressArray["city"] = cityName;
                addressArray["state"] = addressModelList[addressIndex].getState();
                addressArray["zipCode"] = addressModelList[addressIndex].getZip();
            }
            else
            {
            	if (addressModelList[addressIndex].getHouseNumberAlphaStart() != null) {
                    addressArray["businessAddressLine1"] = String(addressModelList[addressIndex].getHouseNumberAlphaStart() + " " + addressModelList[addressIndex].getAddressLine1());
                    addressArray["businessAddressLine1"] = addressArray["businessAddressLine1"].substr(0, 24);                   
            	} else if (addressModelList[addressIndex].getAddressLine1() != null) {
                    addressArray["businessAddressLine1"] = String(addressModelList[addressIndex].getAddressLine1());	
                    addressArray["businessAddressLine1"] = addressArray["businessAddressLine1"].substr(0, 24);                       
            	}
		
				if (addressModelList[addressIndex].getAddressLine2() != null)
                {
                    addressArray["businessAddressLine2"] = String(addressModelList[addressIndex].getAddressLine2());
                    addressArray["businessAddressLine2"] = addressArray["businessAddressLine2"].substr(0, 24);                       
                }
				
				
				logDebug("Business address output addressArray[businessAddressLine1] = "+ addressArray["businessAddressLine1"]);
				logDebug("Business address output addressArray[businessAddressLine2] = "+ addressArray["businessAddressLine2"]);
				
				var cityName = addressModelList[addressIndex].getCity();
				cityName = cityName.substr(0, 14);				
                addressArray["businessCity"] = cityName;
                addressArray["businessState"] = addressModelList[addressIndex].getState();
                addressArray["businessZipCode"] = addressModelList[addressIndex].getZip();
            }
        }
    }
    else
    {
        logDebug("No Address associated to Contact % " + contactNumber);
    }
    
    return addressArray;
}

/**
 * @desc This method is created to manipulate the eligibilityDate for an license
 * @param {licenseExpDate,licenseExpUnit,licenseExpInterval}
 * @returns {Object of an Date} - contains the eligibilityDate Object.
 */


/**
 * @desc This method is created to merge two arrays into one array.
 * @param {src,dest} list of arrays
 * @returns {array} - returns an merged array.
*/
function meargeArray(src, dest)
{
    var mergedArray = new Array();
    
    for(key in src)
    {
        mergedArray[key] = src[key];
    }
    
    for(key in dest)
    {
        mergedArray[key] = dest[key];
    }
    
    return mergedArray;
}
   
  
/**
 * @desc This method is created to retrieve a drop down list description from a standard chioce
 * @param {listName} listName - contains the standard chioce name to be retrieved
 * @returns {array of string} - contains the list description of standard chioce
*/
function getSharedDropDownDescriptionList(listName)
{
    var listArr = new Array();
    var bizDomScriptResult = aa.bizDomain.getBizDomain(String(listName));  //call function to retrieve standard choice
  
    // get the standard choice where the list is stored.
    if(bizDomScriptResult.getSuccess())
    {
        // if found get the list
        var bizDomObj = bizDomScriptResult.getOutput();
        if(bizDomObj.isEmpty())
        {
            logDebug("Standard Choice - " + listName + " not exist ");
            return null;
        }
    
        var bizArr = bizDomObj.toArray();
        
        for(var x in bizArr)
        {
            listArr.push(String(bizArr[x].getDescription()));
            // loop through and populate the Array with the Description
        }
    }
 
    return listArr;
}

/**
 * @desc This method is created to evaluate the License Type , Individual vs Business based on standard choice.
 * @param {specialTxt} a string value
 * @returns {string} - returns an String.
*/
function evaluateLicType(specialTxt)
{
    var licType;
    
    var stdDPLLicTypeChoice ="DPL_LICENSE_TYPE";
    var bizDomScriptResult = aa.bizDomain.getBizDomain(String(stdDPLLicTypeChoice));
  
    // get the standard choice where the list is stored.
  
    if(bizDomScriptResult.getSuccess())
    {
        // if found get the list
        var bizDomObj = bizDomScriptResult.getOutput();
        //make sure the standard choice is not empty
        if(bizDomObj.isEmpty())
        {
            return null;
        }
        
        var bizArr = bizDomObj.toArray();
        
        for(var x in bizArr)
        {
            if(specialTxt.toUpperCase() == String(bizArr[x].getDispBizdomainValue().toUpperCase()))
            { 
                licType = String(bizArr[x].getDescription());
            }
        }
    }
    
    if (licType == null)
    {
        var returnException = new ELPAccelaEMSEException("License type not found in Standard choice for Special text :" + specialTxt);
        logDebug(returnException.toString());
        throw returnException;
    }
 
    return licType;
}

/**
 * @desc This method is created to get the status code based on condition.
 * @param {CapIDModel} CapIDModel an Object - contains the cap id of the CAP record
 * @returns {string} - returns a string value.
*/
function getStatusCode(CapIDModel)
{
    var conditionType = "Compliance";
    var statusCode;
    
    var conditionDesc = {"1" : "Probation Condition", "2" : "Stayed Suspension Condition", "3" :"Revocation Condition"};
   
    //This method determines if a specific condition exists on a Cap record
    for (index in conditionDesc)
    {
        var condtnCheck = conditionCheck(CapIDModel,conditionType,conditionDesc[index]);
        
        if (condtnCheck)
        {
            statusCode = getRecordStatusCode(conditionDesc[index]);
            break;
        }
    }
    
    return statusCode;
}

/**
 * @desc This method is created to manipulate the status code based on cap status.
 * @param {capStatus} capStatus a string value - contains the status of the cap record
 * @returns {string} - returns a string value.
*/
function getRecordStatusCode(capStatus)
{
    var statusCode;
    logDebug("getRecordStatusCode --- " + capStatus);
    switch (String(capStatus))
    {
        case "Probation" :
            statusCode = "P";
            break;
        case "Stayed Suspension" :
            statusCode = "Q";
            break;
        case "Revocation" :
            statusCode = "R";
            break; 
        case "Current" :
           statusCode = "C";
           break;
        case "Deceased" :
            statusCode = "D";
            break;
        case "License Surrendered by Discipline" :
            statusCode = "V";
            break;
        case "Expired" :
            statusCode = "X";
            break;
        case "No Longer Licensed" :
            statusCode = "6";
            break;
        case "Out of Business" :
            statusCode = "7";
            break;
        case "Upgraded" :
            statusCode = "M";
            break;
        default:
            statusCode = null;
            break;    
    }
    
    return statusCode;
}

//
/**
 * @desc This method is created to pad a number with leading zeros.
 * @param {num} Number value to which need to add leading zeros if length is less than 9.
 * @param {width} - width is the max length of Number value.
 * @param {z} - to pad with this special character if not 'Zero'  
*/
function padWithLeadingZeros(num, width, z) {
  z = z || '0';
  width = width || '9';
  num = num + '';
  return num.length >= width ? num : new Array(width - num.length + 1).join(z) + num;
}

function validateSSN(ssn) {
	var pattern = /\d{9}/;
	return pattern.test(ssn);
}

/**
 * The function validateIndividual checks if all required parameters for Insert Individual
 * into Staging are provided.
 *   RAISE_APPLICATION_ERROR(-20001, 'ELP_SP_DOR_DPL_INT_STG_INSERT: 
 *   The ssn OR firstName OR lastName OR addressLine1 OR city OR state OR zipCode is Null');
 * @param {Object} capContact - Parameters to Insert Staging
 * @returns {Boolean} - true if all required parameters are provided; otherwise, false
 */
function validateIndividual(capContact) {
	if ((capContact == null) ||
			(capContact.ssn == null) ||
			(capContact.firstName == null) ||
			(capContact.lastName == null) ||
			(capContact.addressLine1 == null) ||
			(capContact.city == null) ||
			(capContact.state == null) ||
			(capContact.zipCode == null)) {
		return false;
	} else {
		return true;		
	}

}

/**
 * The function validateIndividual checks if all required parameters for Insert Individual
 * into Staging are provided.
 *   RAISE_APPLICATION_ERROR(-20001, 'ELP_SP_DOR_DPL_INT_STG_INSERT: 
 *   The ssn OR firstName OR lastName OR addressLine1 OR city OR state OR zipCode is Null');
 * @param {Object} capContact - Parameters to Insert Staging
 * @returns {Boolean} - true if all required parameters are provided; otherwise, false
 */
function validateIndividual(capContact) {
	if ((capContact == null) ||
			(capContact.ssn == null) ||
			(capContact.firstName == null) ||
			(capContact.lastName == null) ||
			(capContact.addressLine1 == null) ||
			(capContact.city == null) ||
			(capContact.state == null) ||
			(capContact.zipCode == null)) {
		return false;
	} else {
		return true;		
	}

}

/**
 * The function validateBusiness checks if all required parameters for Insert Business 
 * into Staging are provided.
 *   RAISE_APPLICATION_ERROR(-20002, ELP_SP_DOR_DPL_INT_STG_INSERT: 
 *   The fID OR businessName OR businessAddressLine1 OR businessCity OR businessState 
 *   OR businessZipCode is Null);
 * @param {Object} capContact - Parameters to Insert Staging
 * @returns {Boolean} - true if all required parameters are provided; otherwise, false
 */
function validateBusiness(capContact) {
	if ((capContact == null) ||
			(capContact.fId == null) ||
			(capContact.businessName == null) ||
			(capContact.businessAddressLine1 == null) ||
			(capContact.businessCity == null) ||
			(capContact.businessState == null) ||
			(capContact.businessZipCode == null)) {
		return false;
	} else {
		return true;		
	}	
	return true;
}

// POC
function getStgRecords(parameters) {
    logDebug("**INFO: getStgRecords.");
    var dataSet = null;
    try {

        for (p in parameters) {
            logDebug("**INFO: " + p + ": " + parameters[p]);
        }

        var stmt = null;
        var sql = "select B1_PER_ID1, B1_PER_ID2, B1_PER_ID3, EXPIRATION_DATE ,EXPIRATION_INTERVAL_UNITS, EXPIRATION_INTERVAL from " + parameters["tableName"] +
            " where to_date(EXPIRATION_DATE) <= to_date(?, 'MM/DD/YYYY') and to_date(EXPIRATION_DATE) >= to_date(?, 'MM/DD/YYYY')";

        logDebug("** SQL: " + sql);
        stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["endDate"]);
        stmt.setString(2, parameters["startDate"]);

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        logDebug("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}

// POC
function getAKA_INFORecords(parameters) {
    logDebug("**INFO: getAKA_INFORecords.");
    var dataSet = null;
    try {

        for (p in parameters) {
            logDebug("**INFO: " + p + ": " + parameters[p]);
        }

        if (parameters["contactSeqNbr"] == null) {
            return null;
        }

        var stmt = null;
        var sql = "SELECT G7_LNAME from " + parameters["tableName"] +
            " where G1_CONTACT_NBR = (SELECT G1_CONTACT_NBR FROM ACCELA.G3CONTACT where G1_SOCIAL_SECURITY_NUMBER = ? AND SERV_PROV_CODE = ?) ORDER BY REC_DATE DESC";

        logDebug("** SQL: " + sql);
        stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["contactSeqNbr"]);
        stmt.setString(2, parameters["serviceProviderCode"]);

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.akaInfoQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        logDebug("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}