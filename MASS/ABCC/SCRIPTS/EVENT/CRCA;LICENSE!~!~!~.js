/*------------------------------------------------------------------------------------------------------/
/ Program : CRCA;License!~!~!~.js
/ Event: ConvertToRealCapAfter
/
/------------------------------------------------------------------------------------------------------*/
//Promote contacts to Reference and sync

//Promote contacts to Reference and sync
//Handle the addition of contacts to Reference

// ETW - 12/20/18 - Begin Defect EPAWS-997
 if (publicUser) {
	 if (appMatch("License/*/*/Application")) {
		//createRefContactsFromCapContactsAndLinkForMA(capId,null,null,false,true,peopleDuplicateCheck);
		createRefContactsFromCapContactsAndLink(capId, null, null, false, true, peopleDuplicateCheck);

	 } else {
		// createRefContactsFromCapContactsAndLinkForMA(capId, null, null, false,false, peopleDuplicateCheck);
		createRefContactsFromCapContactsAndLink(capId, null, null, false, true, peopleDuplicateCheck);
	 }
 }
// ETW - 12/20/18 - End Defect EPAWS-997
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

setPremiseAddressValidatedFlag(capId);

function setPremiseAddressValidatedFlag(addCapId) {
	var capAddrResult = aa.address.getAddressByCapId(addCapId);
	if (capAddrResult.getSuccess()) {
		var addresses = capAddrResult.getOutput();
		for (zz in addresses) {
			if (addresses[zz].getLevelPrefix()) {
				if (addresses[zz].getLevelPrefix() == "Y") {
					addresses[zz].setValidateFlag("Y");
				} else {
					addresses[zz].setValidateFlag("N");
				}
				addresses[zz].setLevelPrefix("");
				//Still need to Commit the edits
				aa.address.editAddress(addresses[zz]);
			}
		}
	}
}

//Assign Commission Review Tasks to Commissioners
assignTask("Commission Review 1", "JLORIZIO");
assignTask("Commission Review 2", "KMCNALLY");
assignTask("Commission Review 3", "ELASHWAY");
