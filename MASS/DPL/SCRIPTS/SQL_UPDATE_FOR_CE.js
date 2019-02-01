var vA = "select * from GEXAM a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '22128-EL-A' where a.serv_prov_code = 'DPL'";
var vB = "select * from GEDUCATION a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '22128-EL-A' where a.serv_prov_code = 'DPL'";
var vC = "select * from GCONT_EDU a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '22128-EL-A' where a.serv_prov_code = 'DPL'";

var uA = "update GCONT_EDU \
	set REC_STATUS = 'A' \
	where 1=1 \
		and serv_prov_code = 'DPL' \
		and REC_STATUS is null \
		--and b1_per_id1 = '16CAP'\
		--and b1_per_id2 = '00000'\
		--and b1_per_id3 = '00E8Z'\
	"
	
var uB = "update GCONT_EDU \
	set GRADING_STYLE = 'passfail' \
	where 1=1 \
		and serv_prov_code = 'DPL' \
		and GRADING_STYLE = 'Pass/Fail' \
		--and b1_per_id1 = '16CAP'\
		--and b1_per_id2 = '00000'\
		--and b1_per_id3 = '00E8Z'\
	"
	
var uC = "update GCONT_EDU \
	set IS_REQUIRED = 'Y' \
	where 1=1 \
		and serv_prov_code = 'DPL' \
		and IS_REQUIRED is null \
		--and b1_per_id1 = '16CAP'\
		--and b1_per_id2 = '00000'\
		--and b1_per_id3 = '00E8Z'\
	"	

	/*
"IS_REQUIRED":"null" -> 'Y'
"GRADING_STYLE":"Pass/Fail" -> 'passfail'
"FINAL_SCORE":"null" -> '1'
"PASSING_SCORE":"null" -> '0'
"REC_STATUS":"null" -> 'A'
"APPROVED_FLAG":"null" -> 'N'
"SYNC_FLAG":"null" -> 'N'	
*/
	
	

//aa.print(doSQL(vA));
//aa.print(doSQL(vB));
//aa.print(doSQL(vC));

aa.print(doSQL(uA));
aa.print(doSQL(uB));
aa.print(doSQL(uC));

function doSQL(sql) {
	try {
		var array = [];
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sStmt = conn.prepareStatement(sql);

		if (sql.toUpperCase().indexOf("SELECT") == 0) {
			aa.print("executing " + sql);
			var rSet = sStmt.executeQuery();
			while (rSet.next()) {
				var obj = {};
				var md = rSet.getMetaData();
				var columns = md.getColumnCount();
				for (i = 1; i <= columns; i++) {
					obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
				}
				obj.count = rSet.getRow();
				array.push(obj)
			}
			rSet.close();
			aa.print("...returned " + array.length + " rows");
			aa.print(JSON.stringify(array));
		} else if (sql.toUpperCase().indexOf("UPDATE") == 0) {
			aa.print("executing update: " + sql);
			var rOut = sStmt.executeUpdate();
			aa.print(rOut + " rows updated");
		} else {
			aa.print("executing : " + sql);
			var rOut = sStmt.execute();
			aa.print(rOut);
		}
		sStmt.close();
		conn.close();
	} catch (err) {
		aa.print(err.message);
	}
}


/*

executing select * from GEXAM a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 0 rows
[]
undefined
executing select * from GEDUCATION a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 0 rows
[]
undefined
executing select * from GCONT_EDU a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 1 rows
[{"SERV_PROV_CODE":"DPL","B1_PER_ID1":"16CAP","B1_PER_ID2":"00000","B1_PER_ID3":"009M3","CONT_EDU_SEQ":"691412","PROVIDER_NAME":"WORCESTER ELECTRICIAN SCHOOL","PROVIDER_NO":"412","CONT_EDU_NAME":"2017-NEC-C2022","IS_REQUIRED":"null","EDU_CLASS":"C2022","DATE_OF_CLASS":"2018-05-20 00:00:00","HOURS_COMPLATED":"15","GRADING_STYLE":"Pass/Fail","FINAL_SCORE":"null","PASSING_SCORE":"null","EDU_COMMENTS":"null","B1_ADDRESS1":"null","B1_ADDRESS2":"null","B1_ADDRESS3":"null","B1_CITY":"null","B1_STATE":"null","B1_ZIP":"null","B1_PHONE1_COUNTRY_CODE":"null","B1_PHONE1":"null","B1_PHONE2_COUNTRY_CODE":"null","B1_PHONE2":"null","B1_FAX_COUNTRY_CODE":"null","B1_FAX":"null","B1_EMAIL":"null","REC_DATE":"2018-05-30 08:03:50","REC_FUL_NAM":"BATCHUSER","REC_STATUS":"null","B1_COUNTRY":"null","ENT_TYPE":"CAP_CONTEDU","ENT_ID":"null","G1_CONTACT_NBR":"null","APPROVED_FLAG":"null","SYNC_FLAG":"null","B1_REF_ID1":"null","B1_REF_ID2":"null","B1_REF_ID3":"null","B1_PER_GROUP":"License","B1_PER_TYPE":"Electricians","B1_PER_SUB_TYPE":"Journeyman Electrician","B1_PER_CATEGORY":"License","R3_STD_TIME_CLASS_CODE":"null","B1_FILE_DD":"2015-12-23 00:00:00","B1_SPECIAL_TEXT":"null","B1_Q_UD1":"null","B1_Q_UD2":"null","B1_Q_UD3":"null","B1_Q_UD4":"null","B1_STANDARD_TIME":"0","B1_EVENT_CODE":"null","PROJECT_NBR":"3774781","B1_REF_ID":"null","B1_ALT_ID":"53674-EL-B","B1_TRACKING_NBR":"1235483474","B1_APPL_STATUS":"Current","APP_STATUS_GROUP_CODE":"DPL_LICENSE","B1_APPL_STATUS_DATE":"2016-07-25 00:00:00","B1_MODULE_NAME":"License","B1_REPORTED_DATE":"2015-12-23 00:00:00","B1_CREATED_BY_ACA":"N","B1_APPL_CLASS":"null","B1_APP_TYPE_ALIAS":"Journeyman Electrician License","B1_CREATED_BY":"PUBLICUSER134421","B1_ACCESS_BY_ACA":"Y","B1_INITIATED_BY_PRODUCT":"EMSE","B1_IS_MANUAL_ALT_ID":"N","B1_DELEGATE_USER_ID":"null","B1_PAYMENT_STATUS":"null","B1_CERTIFICATION_APPLIED":"null","B1_CERTIFICATION_DATE":"null","B1_PENDING_VALIDATION":"null","IS_VALID_RENEWAL_PASSCODE":"null","count":1}]
undefined



executing select * from GEXAM a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 0 rows
[]
undefined
executing select * from GEDUCATION a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 0 rows
[]
undefined
executing select * from GCONT_EDU a inner join b1permit b on 1=1 and a.serv_prov_code = b.serv_prov_code and a.b1_per_id1 = b.b1_per_id1 and a.b1_per_id3 = b.b1_per_id3 and a.b1_per_id3 = b.b1_per_id3 and b.b1_alt_id = '53674-EL-B' where a.serv_prov_code = 'DPL'
...returned 1 rows
[{"SERV_PROV_CODE":"DPL","B1_PER_ID1":"16CAP","B1_PER_ID2":"00000","B1_PER_ID3":"009M3","CONT_EDU_SEQ":"691412","PROVIDER_NAME":"WORCESTER ELECTRICIAN SCHOOL","PROVIDER_NO":"412","CONT_EDU_NAME":"2017-NEC-C2022","IS_REQUIRED":"Y","EDU_CLASS":"C2022","DATE_OF_CLASS":"2018-05-20 00:00:00","HOURS_COMPLATED":"15","GRADING_STYLE":"passfail","FINAL_SCORE":"1","PASSING_SCORE":"0","EDU_COMMENTS":"null","B1_ADDRESS1":"null","B1_ADDRESS2":"null","B1_ADDRESS3":"null","B1_CITY":"null","B1_STATE":"null","B1_ZIP":"null","B1_PHONE1_COUNTRY_CODE":"null","B1_PHONE1":"null","B1_PHONE2_COUNTRY_CODE":"null","B1_PHONE2":"null","B1_FAX_COUNTRY_CODE":"null","B1_FAX":"null","B1_EMAIL":"null","REC_DATE":"2019-02-01 16:27:51","REC_FUL_NAM":"ADMIN","REC_STATUS":"A","B1_COUNTRY":"null","ENT_TYPE":"CAP_CONTEDU","ENT_ID":"null","G1_CONTACT_NBR":"null","APPROVED_FLAG":"N","SYNC_FLAG":"N","B1_REF_ID1":"null","B1_REF_ID2":"null","B1_REF_ID3":"null","B1_PER_GROUP":"License","B1_PER_TYPE":"Electricians","B1_PER_SUB_TYPE":"Journeyman Electrician","B1_PER_CATEGORY":"License","R3_STD_TIME_CLASS_CODE":"null","B1_FILE_DD":"2015-12-23 00:00:00","B1_SPECIAL_TEXT":"null","B1_Q_UD1":"null","B1_Q_UD2":"null","B1_Q_UD3":"null","B1_Q_UD4":"null","B1_STANDARD_TIME":"0","B1_EVENT_CODE":"null","PROJECT_NBR":"3774781","B1_REF_ID":"null","B1_ALT_ID":"53674-EL-B","B1_TRACKING_NBR":"1235483474","B1_APPL_STATUS":"Current","APP_STATUS_GROUP_CODE":"DPL_LICENSE","B1_APPL_STATUS_DATE":"2016-07-25 00:00:00","B1_MODULE_NAME":"License","B1_REPORTED_DATE":"2015-12-23 00:00:00","B1_CREATED_BY_ACA":"N","B1_APPL_CLASS":"null","B1_APP_TYPE_ALIAS":"Journeyman Electrician License","B1_CREATED_BY":"PUBLICUSER134421","B1_ACCESS_BY_ACA":"Y","B1_INITIATED_BY_PRODUCT":"EMSE","B1_IS_MANUAL_ALT_ID":"N","B1_DELEGATE_USER_ID":"null","B1_PAYMENT_STATUS":"null","B1_CERTIFICATION_APPLIED":"null","B1_CERTIFICATION_DATE":"null","B1_PENDING_VALIDATION":"null","IS_VALID_RENEWAL_PASSCODE":"null","count":1}]
undefined

-Original
[{"SERV_PROV_CODE":"DPL","B1_PER_ID1":"16CAP","B1_PER_ID2":"00000","B1_PER_ID3":"009M3","CONT_EDU_SEQ":"691412","PROVIDER_NAME":"WORCESTER ELECTRICIAN SCHOOL","PROVIDER_NO":"412","CONT_EDU_NAME":"2017-NEC-C2022","IS_REQUIRED":"null","EDU_CLASS":"C2022","DATE_OF_CLASS":"2018-05-20 00:00:00","HOURS_COMPLATED":"15","GRADING_STYLE":"Pass/Fail","FINAL_SCORE":"null","PASSING_SCORE":"null","EDU_COMMENTS":"null","B1_ADDRESS1":"null","B1_ADDRESS2":"null","B1_ADDRESS3":"null","B1_CITY":"null","B1_STATE":"null","B1_ZIP":"null","B1_PHONE1_COUNTRY_CODE":"null","B1_PHONE1":"null","B1_PHONE2_COUNTRY_CODE":"null","B1_PHONE2":"null","B1_FAX_COUNTRY_CODE":"null","B1_FAX":"null","B1_EMAIL":"null","REC_DATE":"2018-05-30 08:03:50","REC_FUL_NAM":"BATCHUSER","REC_STATUS":"null","B1_COUNTRY":"null","ENT_TYPE":"CAP_CONTEDU","ENT_ID":"null","G1_CONTACT_NBR":"null","APPROVED_FLAG":"null","SYNC_FLAG":"null","B1_REF_ID1":"null","B1_REF_ID2":"null","B1_REF_ID3":"null","B1_PER_GROUP":"License","B1_PER_TYPE":"Electricians","B1_PER_SUB_TYPE":"Journeyman Electrician","B1_PER_CATEGORY":"License","R3_STD_TIME_CLASS_CODE":"null","B1_FILE_DD":"2015-12-23 00:00:00","B1_SPECIAL_TEXT":"null","B1_Q_UD1":"null","B1_Q_UD2":"null","B1_Q_UD3":"null","B1_Q_UD4":"null","B1_STANDARD_TIME":"0","B1_EVENT_CODE":"null","PROJECT_NBR":"3774781","B1_REF_ID":"null","B1_ALT_ID":"53674-EL-B","B1_TRACKING_NBR":"1235483474","B1_APPL_STATUS":"Current","APP_STATUS_GROUP_CODE":"DPL_LICENSE","B1_APPL_STATUS_DATE":"2016-07-25 00:00:00","B1_MODULE_NAME":"License","B1_REPORTED_DATE":"2015-12-23 00:00:00","B1_CREATED_BY_ACA":"N","B1_APPL_CLASS":"null","B1_APP_TYPE_ALIAS":"Journeyman Electrician License","B1_CREATED_BY":"PUBLICUSER134421","B1_ACCESS_BY_ACA":"Y","B1_INITIATED_BY_PRODUCT":"EMSE","B1_IS_MANUAL_ALT_ID":"N","B1_DELEGATE_USER_ID":"null","B1_PAYMENT_STATUS":"null","B1_CERTIFICATION_APPLIED":"null","B1_CERTIFICATION_DATE":"null","B1_PENDING_VALIDATION":"null","IS_VALID_RENEWAL_PASSCODE":"null","count":1}]
[{"SERV_PROV_CODE":"DPL","B1_PER_ID1":"16CAP","B1_PER_ID2":"00000","B1_PER_ID3":"009M3","CONT_EDU_SEQ":"691412","PROVIDER_NAME":"WORCESTER ELECTRICIAN SCHOOL","PROVIDER_NO":"412","CONT_EDU_NAME":"2017-NEC-C2022","IS_REQUIRED":"Y","EDU_CLASS":"C2022","DATE_OF_CLASS":"2018-05-20 00:00:00","HOURS_COMPLATED":"15","GRADING_STYLE":"passfail","FINAL_SCORE":"1","PASSING_SCORE":"0","EDU_COMMENTS":"null","B1_ADDRESS1":"null","B1_ADDRESS2":"null","B1_ADDRESS3":"null","B1_CITY":"null","B1_STATE":"null","B1_ZIP":"null","B1_PHONE1_COUNTRY_CODE":"null","B1_PHONE1":"null","B1_PHONE2_COUNTRY_CODE":"null","B1_PHONE2":"null","B1_FAX_COUNTRY_CODE":"null","B1_FAX":"null","B1_EMAIL":"null","REC_DATE":"2019-02-01 16:27:51","REC_FUL_NAM":"ADMIN","REC_STATUS":"A","B1_COUNTRY":"null","ENT_TYPE":"CAP_CONTEDU","ENT_ID":"null","G1_CONTACT_NBR":"null","APPROVED_FLAG":"N","SYNC_FLAG":"N","B1_REF_ID1":"null","B1_REF_ID2":"null","B1_REF_ID3":"null","B1_PER_GROUP":"License","B1_PER_TYPE":"Electricians","B1_PER_SUB_TYPE":"Journeyman Electrician","B1_PER_CATEGORY":"License","R3_STD_TIME_CLASS_CODE":"null","B1_FILE_DD":"2015-12-23 00:00:00","B1_SPECIAL_TEXT":"null","B1_Q_UD1":"null","B1_Q_UD2":"null","B1_Q_UD3":"null","B1_Q_UD4":"null","B1_STANDARD_TIME":"0","B1_EVENT_CODE":"null","PROJECT_NBR":"3774781","B1_REF_ID":"null","B1_ALT_ID":"53674-EL-B","B1_TRACKING_NBR":"1235483474","B1_APPL_STATUS":"Current","APP_STATUS_GROUP_CODE":"DPL_LICENSE","B1_APPL_STATUS_DATE":"2016-07-25 00:00:00","B1_MODULE_NAME":"License","B1_REPORTED_DATE":"2015-12-23 00:00:00","B1_CREATED_BY_ACA":"N","B1_APPL_CLASS":"null","B1_APP_TYPE_ALIAS":"Journeyman Electrician License","B1_CREATED_BY":"PUBLICUSER134421","B1_ACCESS_BY_ACA":"Y","B1_INITIATED_BY_PRODUCT":"EMSE","B1_IS_MANUAL_ALT_ID":"N","B1_DELEGATE_USER_ID":"null","B1_PAYMENT_STATUS":"null","B1_CERTIFICATION_APPLIED":"null","B1_CERTIFICATION_DATE":"null","B1_PENDING_VALIDATION":"null","IS_VALID_RENEWAL_PASSCODE":"null","count":1}]

"IS_REQUIRED":"null" -> 'Y'
"GRADING_STYLE":"Pass/Fail" -> 'passfail'
"FINAL_SCORE":"null" -> '1'
"PASSING_SCORE":"null" -> '0'
"REC_STATUS":"null" -> 'A'
"APPROVED_FLAG":"null" -> 'N'
"SYNC_FLAG":"null" -> 'N'


-- NEW Original
[{"SERV_PROV_CODE":"DPL","B1_PER_ID1":"16CAP","B1_PER_ID2":"00000","B1_PER_ID3":"00E8Z","CONT_EDU_SEQ":"75894","PROVIDER_NAME":"INDIVIDUAL AND NORTHEAST METRO TECH","PROVIDER_NO":"308","CONT_EDU_NAME":"2014-NEC-C2019","IS_REQUIRED":"null","EDU_CLASS":"C2019","DATE_OF_CLASS":"2015-05-16 00:00:00","HOURS_COMPLATED":"15","GRADING_STYLE":"Pass/Fail","FINAL_SCORE":"null","PASSING_SCORE":"null","EDU_COMMENTS":"null","B1_ADDRESS1":"null","B1_ADDRESS2":"null","B1_ADDRESS3":"null","B1_CITY":"null","B1_STATE":"null","B1_ZIP":"null","B1_PHONE1_COUNTRY_CODE":"null","B1_PHONE1":"null","B1_PHONE2_COUNTRY_CODE":"null","B1_PHONE2":"null","B1_FAX_COUNTRY_CODE":"null","B1_FAX":"null","B1_EMAIL":"null","REC_DATE":"2016-04-08 16:25:49","REC_FUL_NAM":"BATCHUSER","REC_STATUS":"null","B1_COUNTRY":"null","ENT_TYPE":"CAP_CONTEDU","ENT_ID":"null","G1_CONTACT_NBR":"null","APPROVED_FLAG":"null","SYNC_FLAG":"null","B1_REF_ID1":"null","B1_REF_ID2":"null","B1_REF_ID3":"null","B1_PER_GROUP":"License","B1_PER_TYPE":"Electricians","B1_PER_SUB_TYPE":"Master Electrician","B1_PER_CATEGORY":"License","R3_STD_TIME_CLASS_CODE":"null","B1_FILE_DD":"2015-12-29 00:00:00","B1_SPECIAL_TEXT":"null","B1_Q_UD1":"null","B1_Q_UD2":"null","B1_Q_UD3":"null","B1_Q_UD4":"null","B1_STANDARD_TIME":"0","B1_EVENT_CODE":"null","PROJECT_NBR":"3053005","B1_REF_ID":"null","B1_ALT_ID":"22128-EL-A","B1_TRACKING_NBR":"1230692417","B1_APPL_STATUS":"Current","APP_STATUS_GROUP_CODE":"DPL_LICENSE","B1_APPL_STATUS_DATE":"2016-07-08 00:00:00","B1_MODULE_NAME":"License","B1_REPORTED_DATE":"2015-12-29 00:00:00","B1_CREATED_BY_ACA":"N","B1_APPL_CLASS":"null","B1_APP_TYPE_ALIAS":"Master Electrician License","B1_CREATED_BY":"PUBLICUSER134421","B1_ACCESS_BY_ACA":"Y","B1_INITIATED_BY_PRODUCT":"EMSE","B1_IS_MANUAL_ALT_ID":"N","B1_DELEGATE_USER_ID":"null","B1_PAYMENT_STATUS":"null","B1_CERTIFICATION_APPLIED":"null","B1_CERTIFICATION_DATE":"null","B1_PENDING_VALIDATION":"null","IS_VALID_RENEWAL_PASSCODE":"null","count":1}]

*/