/*
 * Program: ASA;License!~!~!Application.js
 * Event: ApplicationSubmitAfter
 *
 * For each row in the table add license fee $50 per flight
 */
//addFees();

setContactsSyncFlag("N");

// Added by Bhandhavya on 8/27/2014 to populate AKA tab of the reference contact with AKA ASI on the spear form..

// changed call to people model to use master function which includes addresses
//defect
//var capContactResult = aa.people.getCapContactByCapID(capId);
var capContactResult = getPeople(capId);
       // if(capContactResult.getSuccess())
       // {
           // capContactResult=capContactResult.getOutput();
            for(yy in capContactResult)
            { 
              thisCapContact = capContactResult[yy];
              thisPeople = thisCapContact.getPeople();
              aa.print(thisPeople.contactType);
			  
			  			//BEGIN: Set Business as primary contact - added for defect 3406
			var vContMod = thisCapContact.getCapContactModel();
			var addressList = aa.address.getContactAddressListByCapContact(thisCapContact.getCapContactModel()).getOutput();
			if (vContMod.contactType == "Business")
			{
			   vContMod.setPrimaryFlag("Y");
			}
			else
			{
			   vContMod.setPrimaryFlag("N");
			}
			//aa.people.editCapContact(vContMod);
				 	aa.people.editCapContactWithAttribute(vContMod);
			//END: added for defect 3406  
              
              // if (thisPeople.contactType == "Business")
               // {
                  var asiTemplate = thisPeople.template;
                  if(asiTemplate!=null)
                   {    
                        var templategroup = asiTemplate.getTemplateForms();
                        var field1 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Classification");
                        if(field2)
                        var classification = field1.getDefaultValue();

                        var field2 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "First Name");
                        if(field2)
                        var firstname = field2.getDefaultValue();

                        var field3 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Middle Name");
                        if(field3)
                        var middlename = field3.getDefaultValue();

                        var field4 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Last Name");
                        if(field4)
                        var lastname = field4.getDefaultValue();

                      capContactModel = thisCapContact.getCapContactModel();

                      //Add an AKA row to Ref contact

                      aa.print(capContactModel);
                      var c = getContactObj(capId, thisPeople.contactType);
                      aa.print(c);
                      //add a row when there is atleast one value in any of the AKA fields.
                      if(classification!=null || firstname!=null|| middlename!=null || lastname!=null)
                      {
                        c.addAKA(firstname, middlename, lastname, classification, new Date(), null);
                      }  
    
                  }
            }
    //    }


function getFieldAttributeByName(templateGroups, subGroupName, fieldName) {
    logDebug("ENTER: getFieldAttributeByName");
 
    if (templateGroups == null || templateGroups.size() == 0) {
        return null;
    }
    var subGroups = templateGroups.get(0).getSubgroups();
    for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
        var subGroup = subGroups.get(subGroupIndex);
        //logDebug(subGroup.getSubgroupName() + " " + subGroup.getFields().size());
        if (subGroupName == subGroup.getSubgroupName()) {
            var fields = subGroup.getFields();
            for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
                var field = fields.get(fieldIndex);
                //logDebug(field.getDisplayFieldName());
                if (field.getDisplayFieldName() == fieldName) {
                   //aa.print(field);
                    return field;
                }
            }
        }
    }
 
    logDebug("EXIT: getFieldAttributeByName");
}