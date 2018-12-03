/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_QUERY_LICENSES_TO_SET Trigger : Batch
 |
 | Batch Requirements :
 | - None
 | Batch Options:
 | - SetName - Name of set to which licenses should be added. Set is created if not exists.
 | - Pilot - Set to Yes to indicate only restricted set to be run.
 |
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0

function getScriptText(vScriptName) {
  vScriptName = vScriptName.toUpperCase();
  var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
  var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
  return emseScript.getScriptText() + "";
}

showDebug = false;
showMessage = false;
var maxSeconds = 60 * 60 * 2;
var br = "<br>";

var sysDate = aa.date.getCurrentDate();
var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("BatchJobName");
// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer
var timeExpired = false;
// Email address of the sender
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info

var emailText = "";
var publicUser = "";

try {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_CUSTOM"));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
	eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
	eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
	eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
	eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
	eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
	eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
	eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
	eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

// this flag somehow gets reset in the scripts above, resetting here again so that it doesnt log
showDebug = false;

var muniIdArray = [
"0966","0968"
/*,"0082","0084","0086","0088","0100","0108","0118","0130","0134","0136","0144","0146","0160","0170","0174","0190","0198","0202","0220"
,"0224","0234","0238","0244","0262","0264","0266","0276","0278","0288","0292","0296","0298","0300","0308","0328","0364","0366","0368"
,"0372","0380","0382","0384","0388","0390","0394","0426","0428","0430","0436","0438","0450","0454","0456","0464","0470","0476","0482"
,"0484","0490","0492","0494","0498","0506","0520","0522","0528","0532","0534","0538","0540","0544","0548","0554","0566","0568","0584"
,"0590","0596","0600","0602","0608","0612","0614","0624","0628","0630","0632","0636","0638","0640","0646","0650","0652","0656","0658"
,"0662","0664","0670","0674","0676","0678","0680","0684","0686","0690","0696","0700","0702","0704","0706","0712","0716","0720","0734"
,"0736","0742","0756","0762","0768","0770","0784","0794","0796","0800","0818","0820","0826","0830","0838","0900","0902","0904","0908"
,"0912","0914","0918","0932","0934","0944","0948","0956","0958","0960","0964","0974","0978","0984","1000","1004","1006","1008","1012"
,"1016","1020","1022","1034","1036","1042","1044","1066","1068","1074","1078","1080","1086","1094","1098","1104","1106","1112","1114"
,"1116","1120","1128","1176","1212","1216","1218","1222","1224","1226","1234","1240","1242","1244","1246","1248","1250","1252","1254"
,"1256","1258","1264","1268","1270","1282","1292","1298","1302","1304","1310","1314","1320","1326","1328","1332","1336","1340","1342"
,"1344","1348","1364","1366","1418","1438","1440","1442","1444","1446","1452","1456","1458","1462","1472","1474","1478","1482","1484"
,"1488","1496","1498","1508","1512","1514","1518"*/
];

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "")
  ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
  emailAddress2 = "";

//Set Size
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
  setSize = 1000;

var muniCodeParam = getParam("muniCode");
if ((muniCodeParam == null) || (muniCodeParam == "undefined") || (muniCodeParam == "")) {
	muniCodeParam = "[0-9]{4}";
}

var setNameParam = getParam("setName");
if ((setNameParam == null) || (setNameParam == "undefined") || (setNameParam == "")) {
	setNameParam = "ABCC_MUNICIPAL_TEST";
}

//for (muniCodeIdx in muniIdArray)
//{
//	var muniCode = muniIdArray[muniCodeIdx];
//	var setName = setNameParam + muniCode;
//	processMuniId (setName, muniCode);
//}


//var muniCodeParam = muniIdCode;
//var setNameParam = setName;

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryLicenses2Set",\
					"procedure":{\
						"name":"ELP_SP_LICENSE2SET_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"serv_prov_code","parameterType":"OUT","property":"SERV_PROV_CODE","type":"STRING"},\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"MUNICODE","parameterType":"IN","property":"MUNICODE","type":"STRING"},\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);



	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();

	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if (dbConfiguration) {
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		//logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		var LicenseToSetProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenses2Set") {
				LicenseToSetProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (LicenseToSetProcedure == null) {
			var message = "Cannot find procedure queryLicenses2Set";
			var exception = new Error(message);
			throw exception;
		}
		logMessage("Found queryLicenses2Set: " + supplementalConfiguration.procedure.name);
		
		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		LicenseToSetProcedure.prepareStatement();
		var inputParameters = LicenseToSetProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		emseParameters.MUNICODE = muniCodeParam;
	 
		//LicenseToSetProcedure.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//LicenseToSetProcedure.setParameters(inputParameters);

		//var dataSet = LicenseToSetProcedure.queryProcedure();

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) 
		var dataSet = getRecordsArray(inputParameters,databaseConnection);
	   // var dataSet = getRecordsArray(emseParameters);
	   aa.print("dataSet.length: " +dataSet.length);
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
			var queryResult = dataSet[i];

		    //for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
			//aa.print("My Test>> "+queryResult.customID);
			//continue;
			try {

				if (elapsed() > maxSeconds) {		// Only continue if time hasn't expired
					logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					timeExpired = true;
					break;
				}

				var capId = aa.cap.getCapID(queryResult.customID).getOutput();
                var altIdFields = queryResult.customID.split("-");
				var licClass = getAppSpecific("License Class", capId);
				if (licClass == 'Annual')
				{
					var muniCode = altIdFields[2];
					var setName = setNameParam + muniCode;
					var setExists = false;
					var setGetResult = aa.set.getSetByPK(setName);
					if (setGetResult.getSuccess()) setExists = true;


					if (!setExists) {
						var setDescription = setName;
						var setType = "Batch Print";
						var setStatus = "Pending";
						setExists = createSet(setName, setDescription, setType, setStatus);
					}

					if (setExists) {
						var setObj = new capSet(setName);
						var memberExists = false;
						for (var i in setObj.members) {
							var mCapId = aa.cap.getCapID(setObj.members[i].ID1, setObj.members[i].ID2, setObj.members[i].ID3).getOutput();
							if (mCapId.getCustomID() == capId.getCustomID()) {
								memberExists = true;
								break;
							}
						}
						if (!memberExists) {
							aa.set.add(setName, capId);
							capCount++;
						}
					}
				}

			} catch (ex) {
				aa.print("exception caught: " + ex.message);

				aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
				aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET" + ex.message);
				ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
				ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET. " + ex.message);
				ELPLogging.debug("________________________________________________________________________________");
				ELPLogging.debug("Total Licenses Processed: " + capCount);

				var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_QUERY_LICENSES_TO_SET " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
				ELPLogging.fatal(returnException.toString());
				throw returnException;
				
			}	
		}
    }
function getParam(pParamName) // gets parameter value and logs message showing param value
{
  var ret = "" + aa.env.getValue(pParamName);
  ELPLogging.debug("PARAMETER " + pParamName + " = " + ret);
  return ret;
}

function elapsed() {
  var thisDate = new Date();
  var thisTime = thisDate.getTime();
  return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail(debugText) {
  emailText = emailText + debugText + br;
  ELPLogging.debug(debugText);
}

function addToSet(addToSetCapId, tgtSetName) {
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = tgtSetName;

	aa.print("add to set: " + setName + " cap: " + setCap);

	var setExists = false;
	var setGetResult = aa.set.getSetByPK(setName);
	if (setGetResult.getSuccess()) setExists = true;

	if (!setExists) {
			//logDebug("Set doesn't exists.");
			setDescription = setName;
			setType = "License Sync";
			setStatus = "Pending";
			setExists = createSet(setName, setDescription, setType, setStatus);
	}

	if (setExists) {
		 // logDebug("Set exists. Adding " + addToSetCapId);

			var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(addToSetCapId).getOutput();

			var doesExistInSync = false;
			for (i = 0; i < setsMemberIsPartOf.size(); i++) {
					// aa.print("Part of Set : " + setsMemberIsPartOf.get(i).getSetID());
					if (setName == setsMemberIsPartOf.get(i).getSetID()) {
							doesExistInSync = true;
							aa.print("part of set - " + setsMemberIsPartOf.get(i).getSetID());
					}
			}
			logDebug("doesExistInSync " + doesExistInSync);
			if (!doesExistInSync)
					aa.set.add(setName, addToSetCapId);
	}
}


//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection){
	var sql = "select * from ACCELAINT.ELP_VW_QUERY_FOR_SET";
			
			aa.print(sql);

			var arr = doSQL(sql,databaseConnection);
			return arr;
}

function doSQL(sql,databaseConnection) {

	try {
		var array = [];
		var dbConn = databaseConnection;
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sStmt = dbConn.prepareStatement(sql);

		if (sql.toUpperCase().indexOf("SELECT") == 0) {
			var rSet = sStmt.executeQuery();
			while (rSet.next()) {
				var obj = {};
				var md = rSet.getMetaData();
				var columns = md.getColumnCount();
				for (i = 1; i <= columns; i++) {
					obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
				}
				obj.count = rSet.getRow();
				array.push(obj);
			}
			rSet.close();
			sStmt.close();
			conn.close();
			return array;
		}
	} catch (err) {
		aa.print(err.message);
	}
}

function ObjKeyRename(src, map) {
    var dst = {};
    // src --> dst
    for(var key in src){
        if(key in map)
            // rename key
            dst[map[key]] = src[key];
        else
            // same key
            dst[key] = src[key];
    }
    // clear src
    for(var key in src){
        delete src[key];
    }
    // dst --> src
    for(var key in dst){
        src[key] = dst[key];
    }
}
