var vTableName = "SHIPPING ADDRESS";
var tmpTable = loadASITable4ACA(vTableName, capId);

if (!tmpTable || tmpTable.length == 0) {
	var vAddress;
	var vCity;
	var vState;
	var vZip;
	var vCountry;
	var vASITable = [];
	var vASITRow = [];
	var vCapASITGroup;
	var vUpdatedASIT;

	for (i in tmpTable) {
		if (tmpTable[i].Address) {
			vAddress = tmpTable[i].Address;
		} else if (tmpTable[i].City) {
			vCity = tmpTable[i].City;
		} else if (tmpTable[i].State){
			vState = tmpTable[i].State;
		} else if (tmpTable[i].Zip) {
			vZip = tmpTable[i].Zip;
		} else if (tmpTable[i].Country) {
			vCountry = tmpTable[i].Country;
		}
	}

	vASITRow["Address"] = new asiTableValObj("Address", "" + vAddress, "Y");
	vASITRow["City"] = new asiTableValObj("City", "" + vCity, "Y");
	vASITRow["State"] = new asiTableValObj("State", "" + vState, "Y");
	vASITRow["Zip"] = new asiTableValObj("Zip", "" + vZip, "Y");
	vASITRow["Country"] = new asiTableValObj("Country", "" + vCountry, "Y");

	vASITable.push(vASITRow);

	vCapASITGroup = capId.getAppSpecificTableGroupModel();
	vUpdatedASIT = replaceASITable4ACAPageFlow(vCapASITGroup, vTableName, vASITable);
	capId.setAppSpecificTableGroupModel(vUpdatedASIT);

	aa.env.setValue("CapModel", capId);
}