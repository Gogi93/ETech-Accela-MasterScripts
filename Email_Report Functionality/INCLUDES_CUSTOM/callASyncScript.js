function callASyncScript(vScriptName) {
	//Save variables to the hash table and call sendEmailASync script. 
	var envParameters = aa.util.newHashMap();
	envParameters.put("CapId", capId);
	
	//Start modification to support batch script
	var vEvntTyp = aa.env.getValue("eventType");
	if (vEvntTyp == "Batch Process") {
		aa.env.setValue("CapId", capId);
		//call sendEmailASync script
		logDebug("Attempting to run Non-Async: " + vScriptName);
		aa.includeScript(vScriptName);
	} else {
		//call sendEmailASync script
		logDebug("Attempting to run Async: " + vScriptName);
		aa.runAsyncScript(vScriptName, envParameters);
	}
	//End modification to support batch script
}