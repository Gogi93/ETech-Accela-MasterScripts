try {
	//Get environmental variables passed into the script
	var capId = aa.env.getValue("CapId");

	//Set variables used in the script

	/* Begin Code needed to call master script functions ---------------------------------------------------*/
	//Start modification to support batch script, if not batch then grab globals, if batch do not.
	if (aa.env.getValue("eventType") != "Batch Process") {
		function getScriptText(vScriptName, servProvCode, useProductScripts) {
			if (!servProvCode)
				servProvCode = aa.getServiceProviderCode();
			vScriptName = vScriptName.toUpperCase();
			var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
			try {
				if (useProductScripts) {
					var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
				} else {
					var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
				}
				return emseScript.getScriptText() + "";
			} catch (err) {
				return "";
			}
		}
		var SCRIPT_VERSION = 3.0;
		aa.env.setValue("CurrentUserID", "ADMIN");
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, true));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, true));
		eval(getScriptText("INCLUDES_CUSTOM", null, true));
	} else {
		var balanceDue;
		var capDetailObjResult = aa.cap.getCapDetail(capId);
		if (capDetailObjResult.getSuccess()) {
			capDetail = capDetailObjResult.getOutput();
			balanceDue = capDetail.getBalance();
		}
	}
	/* End Code needed to call master script functions -----------------------------------------------------*/

	// Do stuff here
	
	
} catch (err) {
	logDebug("Error in GENERIC_ASYNC : " + err.message);
}
