//Promote contacts to Reference and sync
/*------------------------------------------------------------------------------------------------------/
/ Program : ASA;License!~!~!~.js
/ Event: ApplicationSubmitAfter
/

/------------------------------------------------------------------------------------------------------*/

//Handle the addition of contacts to Reference
if (!appMatch("License/Retail License/LLA Review/Renewal")) {

	if (!publicUser) {
		if (appMatch("License/*/*/Application")) {
			// ETW - 12/20/18 - Begin Defect EPAWS-997
			//createRefContactsFromCapContactsAndLinkForMA(capId,null,null,false,true, peopleDuplicateCheck);
			createRefContactsFromCapContactsAndLink(capId, null, null, false, true, peopleDuplicateCheck);
			// ETW - 12/20/18 - End Defect EPAWS-997

		} else {
			// ETW - 12/20/18 - Begin Defect EPAWS-997
			//createRefContactsFromCapContactsAndLinkForMA(capId,null,null,false,true, peopleDuplicateCheck);
			createRefContactsFromCapContactsAndLink(capId, null, null, false, true, peopleDuplicateCheck);
			// ETW - 12/20/18 - End Defect EPAWS-997
		}
	}
	/*
	 *
	 * This function will auto assign a task to a user in a department based on a round robin methodology
	 *
	 * wfTask: Workflow Task Name that need to be auto assigned
	 * Department: The department containing the users that will be used for assignment in the format "LICENSING/DPL/LIC/SM/NA/SUPV/NA"
	 * Depends on the standard choice WorkflowAutoAssign to store the index values

	 */
	var department = "ABCC/ABCC/LICENSE/STAFF/ADMIN/STATE/NA";
	autoAssign("Intake", department);

	//Assign Commission Review Tasks to Commissioners
	assignTask("Commission Review 1", "JLORIZIO");
	assignTask("Commission Review 2", "KMCNALLY");
	assignTask("Commission Review 3", "ELASHWAY");

	setPremiseAddressValidatedFlag(capId);
	if (appMatch("License/*/*/Application") || appMatch("License/*/*/Amendment")) {
		logDebug("removing fees!");
		removeAllFees(capId);
	}

	//Added By Evan Cai for EPLACE 3178 on June 7 2017
	setSpecialText(capId);
}
