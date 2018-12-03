/***********************************************************************************************************************************
* @Title 		: 	EMSE_DPL_INT_PCS_INTAKE
* @Author		:	Rajesh Kumar
* @Date			:	03/05/2015
* @Description 	:	This interface will update the exam score & create the respective application & license record retrieved from the
* 					PCS exam vendor.Frequency of the interface is daily.   
* New Updates 	: For Boards Podiatary, Sanitarians, Funeral, Allied health, Optomestrists, Chiropractors introduced in Rel - C.
*                                                                                            
***********************************************************************************************************************************/

try
{
    try
	{   
        //Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 3.0;
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_STRINGBUILDER"));
		eval(getScriptText("EMSE_MA_INT_C_EMAIL"));	
		eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
		eval(getScriptText("EMSE_MA_INT_PCS_LICENSE"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));		
		eval(getScriptText("INCLUDES_CUSTOM"));
		//Added file for EM (Funeral & Embalmer professionals) board
		eval(getScriptText("EMSE_DPL_INT_PCS_EM_INTAKE"));
		// Added a script file for Chiropractors & Allied Health
		eval(getScriptText("EMSE_DPL_INT_PCS_CH_AH_INTAKE"));
		// Added a script file for Optometrists
		eval(getScriptText("EMSE_DPL_INT_PCS_OP_INTAKE"));
		
        var returnException;
        ELPLogging.debug("Finished loading the external scripts");
    }
	catch(ex)
	{
        returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }

    // POC
    var selectQueryConfiguration = '{\
   "selectQuery": {\
      "table": "ELP_TBL_PCS_STG_DPL",\
      "parameters": {\
         "list": [\
            {\
               "source": "RESULT",\
               "name": "intakeStatus",\
               "parameterType": "IN",\
               "property": "intakeStatus",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "runDate",\
               "parameterType": "IN",\
               "property": "runDate",\
               "type": "DATE_TIME"\
            }\
         ]\
      },\
      "resultSet": {\
         "list": [\
            {\
               "source": "RESULT",\
               "name": "rowNumber",\
               "parameterType": "OUT",\
               "property": "ROW_NUMBER",\
               "type": "INTEGER"\
            },\
            {\
               "source": "RESULT",\
               "name": "boardCode",\
               "parameterType": "OUT",\
               "property": "BOARD_CODE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "licenseNumber",\
               "parameterType": "OUT",\
               "property": "LICENSE_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "typeClass",\
               "parameterType": "OUT",\
               "property": "TYPE_CLASS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "recordID",\
               "parameterType": "OUT",\
               "property": "RECORD_ID",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "recordType",\
               "parameterType": "OUT",\
               "property": "RECORD_TYPE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "batchInterfaceName",\
               "parameterType": "OUT",\
               "property": "BATCH_INTERFACE_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "serviceProviderCode",\
               "parameterType": "OUT",\
               "property": "SERVICE_PROVIDER_CODE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "transactionGroup",\
               "parameterType": "OUT",\
               "property": "TRANSACTION_GROUP",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "applicationType",\
               "parameterType": "OUT",\
               "property": "APPLICATION_TYPE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "licIssueDate",\
               "parameterType": "OUT",\
               "property": "LIC_ISSUE_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "licenseJurisdiction",\
               "parameterType": "OUT",\
               "property": "LICENSE_JURISDICTION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "licenseStatus",\
               "parameterType": "OUT",\
               "property": "LICENSE_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "firstName",\
               "parameterType": "OUT",\
               "property": "FIRST_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "middleName",\
               "parameterType": "OUT",\
               "property": "MIDDLE_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "lastName",\
               "parameterType": "OUT",\
               "property": "LAST_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "suffix",\
               "parameterType": "OUT",\
               "property": "SUFFIX",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "gender",\
               "parameterType": "OUT",\
               "property": "GENDER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherFirstName",\
               "parameterType": "OUT",\
               "property": "OTHER_FIRST_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherMiddleName",\
               "parameterType": "OUT",\
               "property": "OTHER_MIDDLE_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLastName",\
               "parameterType": "OUT",\
               "property": "OTHER_LAST_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "dateOfBirth",\
               "parameterType": "OUT",\
               "property": "DATE_OF_BIRTH",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "generation",\
               "parameterType": "OUT",\
               "property": "GENERATION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "socSecNumber",\
               "parameterType": "OUT",\
               "property": "SOC_SEC_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "primaryPhone",\
               "parameterType": "OUT",\
               "property": "PRIMARY_PHONE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "primaryExtension",\
               "parameterType": "OUT",\
               "property": "PRIMARY_EXTENSION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prefCommunication",\
               "parameterType": "OUT",\
               "property": "PREF_COMMUNICATION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "emailID",\
               "parameterType": "OUT",\
               "property": "EMAIL_ID",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "buildingNum",\
               "parameterType": "OUT",\
               "property": "BUILDING_NUM",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "addrs1stLn",\
               "parameterType": "OUT",\
               "property": "ADDRS_1ST_LN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "addrs2ndLn",\
               "parameterType": "OUT",\
               "property": "ADDRS_2ND_LN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "cityTwn",\
               "parameterType": "OUT",\
               "property": "CITY_TWN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "state",\
               "parameterType": "OUT",\
               "property": "STATE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "zipCodeA",\
               "parameterType": "OUT",\
               "property": "ZIP_CODEA",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "zipCodeB",\
               "parameterType": "OUT",\
               "property": "ZIP_CODEB",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "businessName",\
               "parameterType": "OUT",\
               "property": "BUSINESS_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bBuildingNumber",\
               "parameterType": "OUT",\
               "property": "B_BUILDING_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bAddrLn1",\
               "parameterType": "OUT",\
               "property": "B_ADDR_LN_1",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bAddrLn2",\
               "parameterType": "OUT",\
               "property": "B_ADDR_LN_2",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bCityTwn",\
               "parameterType": "OUT",\
               "property": "B_CITY_TWN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bState",\
               "parameterType": "OUT",\
               "property": "B_STATE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bZipA",\
               "parameterType": "OUT",\
               "property": "B_ZIP_A",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "bZipB",\
               "parameterType": "OUT",\
               "property": "B_ZIP_B",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "cashNumber",\
               "parameterType": "OUT",\
               "property": "CASH_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "cashDate",\
               "parameterType": "OUT",\
               "property": "CASH_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "licExpirDate",\
               "parameterType": "OUT",\
               "property": "LIC_EXPIR_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "localLicensingMunicipality",\
               "parameterType": "OUT",\
               "property": "LOCAL_LICENSING_MUNICIPALITY",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "discActionTaken",\
               "parameterType": "OUT",\
               "property": "DISC_ACTION_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "pendingDiscAction",\
               "parameterType": "OUT",\
               "property": "PENDING_DISC_ACTION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "voluntarilySurrendered",\
               "parameterType": "OUT",\
               "property": "VOLUNTARILY_SURRENDERED",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "appliedOrDeniedProfLic",\
               "parameterType": "OUT",\
               "property": "APPLIED_OR_DENIED_PROF_LIC",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "juriConvicted",\
               "parameterType": "OUT",\
               "property": "JURI_CONVICTED",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "profQualifications",\
               "parameterType": "OUT",\
               "property": "PROF_QUALIFICATIONS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "comityQualifications",\
               "parameterType": "OUT",\
               "property": "COMITY_QUALIFICATIONS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examDiscipline",\
               "parameterType": "OUT",\
               "property": "EXAM_DISCIPLINE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "durationOfExam",\
               "parameterType": "OUT",\
               "property": "DURATION_OF_EXAM",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "eligibility",\
               "parameterType": "OUT",\
               "property": "ELIGIBILITY",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "schoolGraduated",\
               "parameterType": "OUT",\
               "property": "SCHOOL_GRADUATED",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "gradYr",\
               "parameterType": "OUT",\
               "property": "GRAD_YR",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "schoolLocation",\
               "parameterType": "OUT",\
               "property": "SCHOOL_LOCATION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "degree",\
               "parameterType": "OUT",\
               "property": "DEGREE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "degreeEarnedOutside",\
               "parameterType": "OUT",\
               "property": "DEGREE_EARNED_OUTSIDE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "degreeEvaluated",\
               "parameterType": "OUT",\
               "property": "DEGREE_EVALUATED",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "engagementNo",\
               "parameterType": "OUT",\
               "property": "ENGAGEMENT_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "expCategory",\
               "parameterType": "OUT",\
               "property": "EXP_CATEGORY",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "certifiedInOtherState",\
               "parameterType": "OUT",\
               "property": "CERTIFIED_IN_OTHER_STATE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherCertificateNumber",\
               "parameterType": "OUT",\
               "property": "OTHER_CERTIFICATE_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLicenseType",\
               "parameterType": "OUT",\
               "property": "OTHER_LICENSE_TYPE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLicenseNumber",\
               "parameterType": "OUT",\
               "property": "OTHER_LICENSE_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLicenseJurisdiction",\
               "parameterType": "OUT",\
               "property": "OTHER_LICENSE_JURISDICTION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLicenseIssueDt",\
               "parameterType": "OUT",\
               "property": "OTHER_LICENSE_ISSUE_DT",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherLicenseStatus",\
               "parameterType": "OUT",\
               "property": "OTHER_LICENSE_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "engagementStDate",\
               "parameterType": "OUT",\
               "property": "ENGAGEMENT_ST_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "engagementEndDate",\
               "parameterType": "OUT",\
               "property": "ENGAGEMENT_END_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "engagementElapsedTime",\
               "parameterType": "OUT",\
               "property": "ENGAGEMENT_ELAPSED_TIME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "preResponsibleCharge",\
               "parameterType": "OUT",\
               "property": "PRE_RESPONSIBLE_CHARGE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "responsibleCharge",\
               "parameterType": "OUT",\
               "property": "RESPONSIBLE_CHARGE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "profExperience",\
               "parameterType": "OUT",\
               "property": "PROF_EXPERIENCE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "totalExperience",\
               "parameterType": "OUT",\
               "property": "TOTAL_EXPERIENCE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "expUnlicensedIndividual",\
               "parameterType": "OUT",\
               "property": "EXP_UNLICENSED_INDIVIDUAL",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "otherExperience",\
               "parameterType": "OUT",\
               "property": "OTHER_EXPERIENCE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "supervisingEngineer",\
               "parameterType": "OUT",\
               "property": "SUPERVISING_ENGINEER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "employer",\
               "parameterType": "OUT",\
               "property": "EMPLOYER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "expGainedOutside",\
               "parameterType": "OUT",\
               "property": "EXP_GAINED_OUTSIDE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "applicationNumber",\
               "parameterType": "OUT",\
               "property": "APPLICATION_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "applicationDate",\
               "parameterType": "OUT",\
               "property": "APPLICATION_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "certificateNo",\
               "parameterType": "OUT",\
               "property": "CERTIFICATE_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "certificateIssueDate",\
               "parameterType": "OUT",\
               "property": "CERTIFICATE_ISSUE_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevFSExamTaken",\
               "parameterType": "OUT",\
               "property": "PREV_FS_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevExamJuri",\
               "parameterType": "OUT",\
               "property": "PREV_EXAM_JURI",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevExamDate1",\
               "parameterType": "OUT",\
               "property": "PREV_EXAM_DATE_1",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevExamScore1",\
               "parameterType": "OUT",\
               "property": "PREV_EXAM_SCORE_1",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevExamCertNo",\
               "parameterType": "OUT",\
               "property": "PREV_EXAM_CERT_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevLSExamTaken",\
               "parameterType": "OUT",\
               "property": "PREV_LS_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamJuri",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_JURI",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamDt",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_DT",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamTimesTaken",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_TIMES_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamDuration",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_DURATION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamScore",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_SCORE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevMALSExamTaken",\
               "parameterType": "OUT",\
               "property": "PREV_MA_LS_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevMALSExamDt",\
               "parameterType": "OUT",\
               "property": "PREV_MA_LS_EXAM_DT",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevMALSExamTimesTaken",\
               "parameterType": "OUT",\
               "property": "PREV_MA_LS_EXAM_TIMES_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevMALSExamScore",\
               "parameterType": "OUT",\
               "property": "PREV_MA_LS_EXAM_SCORE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevFEExamDiscipline",\
               "parameterType": "OUT",\
               "property": "PREV_FE_EXAM_DISCIPLINE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPPExamDiscipline",\
               "parameterType": "OUT",\
               "property": "PREV_PP_EXAM_DISCIPLINE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevFEExamTaken",\
               "parameterType": "OUT",\
               "property": "PREV_FE_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevPEExamTaken",\
               "parameterType": "OUT",\
               "property": "PREV_PE_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examDate",\
               "parameterType": "OUT",\
               "property": "EXAM_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "examType",\
               "parameterType": "OUT",\
               "property": "EXAM_TYPE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examClassification",\
               "parameterType": "OUT",\
               "property": "EXAM_CLASSIFICATION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examScore",\
               "parameterType": "OUT",\
               "property": "EXAM_SCORE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examResult",\
               "parameterType": "OUT",\
               "property": "EXAM_RESULT",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "noOfTimesExamTaken",\
               "parameterType": "OUT",\
               "property": "NO_OF_TIMES_EXAM_TAKEN",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "enrollmentDate",\
               "parameterType": "OUT",\
               "property": "ENROLLMENT_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "examStatus",\
               "parameterType": "OUT",\
               "property": "EXAM_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "correctionIndicator",\
               "parameterType": "OUT",\
               "property": "CORRECTION_INDICATOR",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "writtenScore1",\
               "parameterType": "OUT",\
               "property": "WRITTEN_SCORE_1",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "writtenScore2",\
               "parameterType": "OUT",\
               "property": "WRITTEN_SCORE_2",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "writtenScore3",\
               "parameterType": "OUT",\
               "property": "WRITTEN_SCORE_3",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "writtenScore4",\
               "parameterType": "OUT",\
               "property": "WRITTEN_SCORE_4",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "writtenScore5",\
               "parameterType": "OUT",\
               "property": "WRITTEN_SCORE_5",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "reciprocity",\
               "parameterType": "OUT",\
               "property": "RECIPROCITY",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "scoreIndicator",\
               "parameterType": "OUT",\
               "property": "SCORE_INDICATOR",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "noFeeCollected",\
               "parameterType": "OUT",\
               "property": "NO_FEE_COLLECTED",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "examFormNumb",\
               "parameterType": "OUT",\
               "property": "EXAM_FORM_NUMB",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "crossReferenceNo",\
               "parameterType": "OUT",\
               "property": "CROSS_REFERENCE_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "serialNumber",\
               "parameterType": "OUT",\
               "property": "SERIAL_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "referencesName",\
               "parameterType": "OUT",\
               "property": "REFERENCES_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "referencesContactInfo",\
               "parameterType": "OUT",\
               "property": "REFERENCES_CONTACT_INFO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "referencesType",\
               "parameterType": "OUT",\
               "property": "REFERENCES_TYPE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "prevCandidateIDNumber",\
               "parameterType": "OUT",\
               "property": "PREV_CANDIDATE_ID_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "militaryStatus",\
               "parameterType": "OUT",\
               "property": "MILITARY_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "tempPermitNo",\
               "parameterType": "OUT",\
               "property": "TEMP_PERMIT_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "hadPrevTempPermit",\
               "parameterType": "OUT",\
               "property": "HAD_PREV_TEMP_PERMIT",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "tempPermitExpiryDate",\
               "parameterType": "OUT",\
               "property": "TEMP_PERMIT_EXPIRY_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "haveSubmittedComityApp",\
               "parameterType": "OUT",\
               "property": "HAVE_SUBMITTED_COMITY_APP",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "tempPermitStartDate",\
               "parameterType": "OUT",\
               "property": "TEMP_PERMIT_START_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "eligibleForConductingWork",\
               "parameterType": "OUT",\
               "property": "ELIGIBLE_FOR_CONDUCTING_WORK",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "arrangedAssistance",\
               "parameterType": "OUT",\
               "property": "ARRANGED_ASSISTANCE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "permitNo",\
               "parameterType": "OUT",\
               "property": "PERMIT_NO",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "permitIssueDate",\
               "parameterType": "OUT",\
               "property": "PERMIT_ISSUE_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "permitExpirationDate",\
               "parameterType": "OUT",\
               "property": "PERMIT_EXPIRATION_DATE",\
               "type": "DATE_TIME"\
            },\
            {\
               "source": "RESULT",\
               "name": "jurisdiction",\
               "parameterType": "OUT",\
               "property": "JURISDICTION",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "permitTypeClass",\
               "parameterType": "OUT",\
               "property": "PERMIT_TYPE_CLASS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpCompName",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_COMP_NAME",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpAddrLn1",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_ADDR_LN_1",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpAddrLn2",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_ADDR_LN_2",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpCity",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_CITY",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpState",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_STATE",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpZipCodeA",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_ZIP_CODEA",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "presEmpZipCodeB",\
               "parameterType": "OUT",\
               "property": "PRES_EMP_ZIP_CODEB",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "candidateIDNumber",\
               "parameterType": "OUT",\
               "property": "CANDIDATE_ID_NUMBER",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "extractStatus",\
               "parameterType": "OUT",\
               "property": "EXTRACT_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "intakeStatus",\
               "parameterType": "OUT",\
               "property": "INTAKE_STATUS",\
               "type": "STRING"\
            },\
            {\
               "source": "RESULT",\
               "name": "runDate",\
               "parameterType": "OUT",\
               "property": "RUN_DATE",\
               "type": "DATE_TIME"\
            }\
         ]\
      }\
   }\
}';
	
	try
    {
        //load all of the input parameters into objects
        var stagingConfigObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("stagingConfiguration"));
        var staticParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));
        var dynamicParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("dynamicParameters"));
        var batchAppResultObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));

        // POC
        var selectQueryObj = datatypeHelper.loadObjectFromParameter(selectQueryConfiguration);

        ELPLogging.debug("Finished loading the input parameters into JSON objects");
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
	
	try
    {
        //Create a connection to the Staging Table Database
        var dbConn = DBUtils.connectDB(stagingConfigObj.connectionInfo);
        ELPLogging.debug("Established a Database Connection");
		
		// License Data configuration
		var licenseParameters = {};
    	licenseParameters.servProvCode = "DPL";
    	var licenseData = new LicenseData(licenseParameters);
		
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Connecting to Staging Table Database " + ex.message, ScriptReturnCodes.STAGING_CONNECTION);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
	
	try
    {
        // POC
        var processedCount = countStagingRecords(new Date(batchAppResultObj.runDate));
        ELPLogging.debug("**INFO: processedCount = " + processedCount);

        // POC
        // var processedCount = countImportedRecords(new Date(batchAppResultObj.runDate));
        updateDynamicParams(processedCount);
        dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
        var DPS = JSON.stringify(dynamicParamObj);
        aa.env.setValue("dynamicParameters", DPS);
    }
    catch(ex)
    {
        ELPLogging.debug("Error in updating Dynamic table with processed record count " + ex.errorMessage);
    }
	
	//Global variable declaration
	ELPLogging.debug("batchAppResultObj.runDate = "+batchAppResultObj.runDate);
	
	var runDateMs = Date.parse(batchAppResultObj.runDate);   
	if (runDateMs != null)
	{
    	var runDate = new Date(runDateMs);    		
	} 
	else 
	{
		var runDate = new Date();
	}
	
	var EN_BOARDSTAFF_ID = "EN|BOARDSTAFF";
	var PY_BOARDSTAFF_ID = "PY|BOARDSTAFF";
	var HO_BOARDSTAFF_ID = "HO|BOARDSTAFF";
	
	var AH_BOARDSTAFF_ID = "AH|BOARDSTAFF";
	var EM_BOARDSTAFF_ID = "EM|BOARDSTAFF";
	var SA_BOARDSTAFF_ID = "SA|BOARDSTAFF";
	var PD_BOARDSTAFF_ID = "dsanchez";
	
	var TASK_ASSIGNMENT_STD_CHOICE = "TASK_ASSIGNMENT";
	var EXAM_RECORD = "1";
	var APPLICATION_RECORD = "2";
	var LICENSE_RECORD = "3";
	var CONDITION_TYPE = "ELP Interfaces";
	var RESEND_CONDITION = "License record resent by exam vendor";
	var SSN_CONDITION = "Invalid SSN";
	var SSN_CONDITION_COMMENT = "SSN provided for the applicant failed validation";
	var BAD_ADDRESS_CONDITION = "Invalid Address";
	var BAD_ADDRESS_CONDITION_COMMENT = "PCS Address validation failed for Contact Address : ";
    var VENDOR = "PCS";
    
	var PD_PROVIDER_NAME = "NBPME";
    var SA_PROVIDER_NAME = "PCS";
    var OP_PROVIDER_NAME = "PCS";
	
    var HOUR_SEC = (60 * 60);
    var TIMER = new ELPTimer(HOUR_SEC);
	var CAP_TYPE_STD_CHOICE = "INTERFACE_CAP_TYPE";
	var PASSING_GRADE = "PASS";
	var PASSING_SCORE = 70;
	
	var PD_PASSING_SCORE = 75;
	var LL_PASSING_SCORE = 9999;
	var SA_PASSING_SCORE = 650;
	
	var VALIDATE_LICENSE = true;
	var EXAM_WINDOW = true;
	var EXAM_ATTEMPT_TWO = 2;
	var EXAM_ATTEMPT_TWELVE = 12;
	var EN_PE_PLS_CONDITION_EXAM_FAILURE = "EN Exam Failure Limit";
	var PY_CONDITION_EXAM_FAILURE = "PY Exam Failure Limit";
	var CONDITION_REGISTRATION_EXPIRED = "Exam registration expired";
	var CONDITION_REGISTRATION_EXPIRED_COMMENT = "Exam was taken more than 3 year from approval to take the exam";
	var RECORD_TYPE = {1:"Exam Record",2:"Application Record", 3:"License Record"};
	var WORKFLOW_STATUS = "Approved to Sit for Exam";
	var WFTASK = "Exam";
    var WFSTATUS = "Board Review";
	var EN_TEMP_PERMIT = "TP";
	var EN_PE  = "PE";
	var EN_PLS = "LS";
	var EXAM_WINDOW_THREE_YEAR = 3;
	var addRecordToMonthlyPaymentSetFlag = false;
	var stdChoiceExamQualification = "PCS_DPL_EXAM_QUALIFICATION";
	var CONDITION_TEMP_PERMIT_TYPE="ELP Interfaces";
	var CONDITION_TEMP_PERMIT_EXISTS="Temporary Permit Exists";
	var CONDITION_TEMP_PERMIT_EXISTS_COMMENT="Temporary Permit Exists";
	var fileName = staticParamObj.filePath;
	
	//Finished declaring global variables
	
	//Required fields declaration for Boards and Record Type.
	var APPLICATION_REQUIRED_FIELDS = "Board Code, Type Class, First Name, Last Name, Date of birth, SSN, Address Line 1, City, State, Zip Code, Application Type";
	var EXAM_REQUIRED_FIELDS = "Board Code, Type Class, Record Type, First Name, Last Name, Date Of Birth, SSN, Record ID, Exam Date";
	var LICENSE_REQUIRED_FIELDS = "Board Code, Type Class, Record Type, First Name, Last Name, SSN, License Number, License Issue Date, Cash Number, Cash Date";
	var EN_EI_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var EN_SI_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var EN_PE_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var EN_LS_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var EN_TP_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS + ", License Number, License Issue Date, Cash Number, Cash Date";
	var PD_PD_APPLICATION_REQUIRED_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var SA_SA_REQUIRED_APPLICATION_FIELDS = APPLICATION_REQUIRED_FIELDS;
	var SA_SA_LICENSE_REQUIRED_FIELDS     = LICENSE_REQUIRED_FIELDS + "Exam Date";
	var PD_LL_APPLICATION_REQUIRED_FIELDS = "Board Code, Type Class, Record Type, First Name, Last Name, Date of birth, SSN, Address Line 1, City, State, Zip Code, Cash Number, Cash Date, Exam Date, Exam Result";
	var PD_PD_LICENSE_REQUIRED_FIELDS = LICENSE_REQUIRED_FIELDS + ", Date of birth, Address Line 1, City, State, Zip Code, Exam Date";
	var APPLICATION_EXAM_LICENSE_REQUIRED_FIELDS = LICENSE_REQUIRED_FIELDS + ",Date of birth, Address Line 1, City, State, Zip Code, Exam Date";
	var AH_LICENSE_REQUIRED_FIELDS = APPLICATION_EXAM_LICENSE_REQUIRED_FIELDS;
	var CH_LICENSE_REQUIRED_FIELDS = APPLICATION_EXAM_LICENSE_REQUIRED_FIELDS;
	var EM_LICENSE_REQUIRED_FIELDS = APPLICATION_EXAM_LICENSE_REQUIRED_FIELDS;
	
	
	//Required Fields Key Array
	var requiredFieldArray = {"EN-EI-2" :EN_EI_REQUIRED_APPLICATION_FIELDS, "EN-SI-2" :  EN_SI_REQUIRED_APPLICATION_FIELDS, "EN-PE-2":EN_PE_REQUIRED_APPLICATION_FIELDS, "EN-LS-2":EN_LS_REQUIRED_APPLICATION_FIELDS, "EN-EI-1" :EXAM_REQUIRED_FIELDS, "EN-SI-1" :  EXAM_REQUIRED_FIELDS, "EN-PE-1":EXAM_REQUIRED_FIELDS, "EN-LS-1":EXAM_REQUIRED_FIELDS,
							  "EN-EI-3":LICENSE_REQUIRED_FIELDS, "EN-SI-3":LICENSE_REQUIRED_FIELDS, "EN-PE-3":LICENSE_REQUIRED_FIELDS, "EN-LS-3":LICENSE_REQUIRED_FIELDS, "EN-TP-3":EN_TP_REQUIRED_APPLICATION_FIELDS, "PY-1":EXAM_REQUIRED_FIELDS, "PY-3":LICENSE_REQUIRED_FIELDS, "HO-1":EXAM_REQUIRED_FIELDS, "HO-2":APPLICATION_REQUIRED_FIELDS,
							  "AH-AT-3":AH_LICENSE_REQUIRED_FIELDS, "AH-OA-3":AH_LICENSE_REQUIRED_FIELDS, "AH-OT-3":AH_LICENSE_REQUIRED_FIELDS, "AH-PA-3":AH_LICENSE_REQUIRED_FIELDS, "AH-PT-3":AH_LICENSE_REQUIRED_FIELDS,"PD-LL-2":PD_LL_APPLICATION_REQUIRED_FIELDS, "PD-PD-3":PD_PD_LICENSE_REQUIRED_FIELDS, "SA-SA-2":SA_SA_REQUIRED_APPLICATION_FIELDS, "SA-SA-3":SA_SA_LICENSE_REQUIRED_FIELDS, "PD-PD-2":PD_PD_APPLICATION_REQUIRED_FIELDS};
	
	var systemUserObjResult = aa.person.getUser("BATCHUSER");
	var systemUserObj;
	if (systemUserObjResult.getSuccess())
	{
		systemUserObj = systemUserObjResult.getOutput();
	}
	
	var dataSetStg = null;
	var queryResult;
	var refContactNumber;
	var capID;
	var arrayKey;
	
	
	var maxSeconds = 60 * 59 * 1;
	var timeExpired = false;
	// Global variables
	var batchStartDate = new Date();
	// System Date
	var batchStartTime = batchStartDate.getTime();
	
	var PE_APP_TYPE = "PE";//"Professional Engineer";
	var EIT_APP_TYPE = "EI";//"Engineer In Training";
	var SIT_APP_TYPE = "SI";//"Land Surveyor in Training";
	var PLS_APP_TYPE = "LS";//"Professional Land Surveyor";
	var TP_APP_TYPE = "TP";//"Temporary Permit";
	var PY_APP_TYPE = "PY";
	var HO_APP_TYPE = "HO";
	
	var AT_APP_TYPE = "AT";//"Athletic Trainer";
	var OA_APP_TYPE = "OA";//"Occupational Therapist Assistant";
	var OT_APP_TYPE = "OT";//"Occupational Therapist";
	var PA_APP_TYPE = "PA";//"Physical Therapist Assistant";
	var PT_APP_TYPE = "PT";//"Physical Therapist";
	var LL_APP_TYPE = "LL";//"Limited License";
	var PD_APP_TYPE = "PD";//"Podiatrists Permanent Licence";
	var SA_APP_TYPE = "SA";//Sanatarians 
	
	var PCS_TYPE_CLASSES_STD_CHOICE = "PCS_TYPE_CLASSES";
	
	var contactAddressDetailsArray = new Array();
	
	try
    {
        // POC
        var stagingQueryParameters = {
            "intakeStatus":"EXTRACTED_FILE",
            "tableName": selectQueryObj.selectQuery.table
        };

        var dataSetStg = getStgRecords(stagingQueryParameters);

		//Query staging table based on intake status as "EXTRACTED_FILE".
		//IN parameters to the query stored procedure
		// var emseQueryParameters ={"intakeStatus":"EXTRACTED_FILE"};
		//Querying staging table
		// dataSetStg = queryStgRecord(emseQueryParameters);
	}
	catch(ex if ex instanceof StoredProcedureException)
    {
        returnException = new ELPAccelaEMSEException("Error querying Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
        ELPLogging.fatal(" Fatal Error "+returnException.toString());
        throw returnException;
    }
	
	var flagEITSIT = false;
	ELPLogging.debug("Loop through the individual record retrieved from the file");
	var bCode;
    var recCount = 0;
	while((queryResult = dataSetStg.next()) != null)
	{
        recCount++;
		flagEITSIT = false;
		
		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			ELPLogging.debug("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " 
							+ elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			ELPLogging.debug("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " 
							+ elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}		
		
		try
		{
            var tmpQueryResult = {"BOARD_CODE":queryResult.boardCode,"TYPE_CLASS":(queryResult.typeClass).trim(),"LICENSE_NUMBER":queryResult.licenseNumber,"LIC_EXP_DATE":"","ISSUE_DATE":queryResult.licIssueDate};
			bCode = queryResult.boardCode;
			//For EM Board start processing is redirected to another file EMSE_DPL_INT_PCS_EM_INTAKE
			if(queryResult.boardCode == "EM")
			{
				//Added Release C board
				//check if valid type class exists in the standard choice PCS_TYPE_CLASSES
				if(!isValidTypeClass(queryResult))
				{
					var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Invalid Type Class :"+queryResult.typeClass}
					updateStgRecord(updateParameters);
					ELPLogging.debug("Processed type class is invalid : "+ queryResult.typeClass);
					continue;
				}

				if (queryResult.recordType == "3")
				{
					if (licenseData.checkLicenseNumber("", tmpQueryResult))
					{				
						processEMboardRecords(queryResult);
					}
					else
					{
						var errorMessage = "License number already exists in Accela: "+queryResult.licenseNumber;
						var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : queryResult.licenseNumber,
						"ErrorDescription" : errorMessage, "runDate" : runDate};
				
						callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						
						var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage}
						updateStgRecord(updateParameters);
					}
				}
				else
				{
					processEMboardRecords(queryResult);
				}
			}
			else if(queryResult.boardCode == "CH" || queryResult.boardCode == "AH") {
				
				addRecordToMonthlyPaymentSetFlag = false;
				//check if valid type class exists in the standard choice PCS_TYPE_CLASSES
				if(!isValidTypeClass(queryResult))
				{
					var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Invalid Type Class :"+queryResult.typeClass}
					updateStgRecord(updateParameters);
					ELPLogging.debug("Processed type class is invalid : "+ queryResult.typeClass);
					continue;
				}
				
				if (queryResult.recordType == "3")
				{
					if (licenseData.checkLicenseNumber("", tmpQueryResult))
					{				
						processCHOrAHBoardRecords(queryResult);
					}
					else
					{
						var errorMessage = "License number already exists in Accela: "+queryResult.licenseNumber;
						var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : queryResult.licenseNumber,
						"ErrorDescription" : errorMessage, "runDate" : runDate};
				
						callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						
						var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage}
						updateStgRecord(updateParameters);
					}
				}
				else
				{
					processCHOrAHBoardRecords(queryResult);
				}
			}
			else if(queryResult.boardCode == "OP") {
				
				addRecordToMonthlyPaymentSetFlag = false;
				
				if(isNaN(queryResult.licenseNumber))
				{
					ELPLogging.debug("License Number Garbage value found.");
					var recordID;
					if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				    {
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				    }
				    else if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					var errorMessage = "PCS Record having garbage values for license Number: "+queryResult.licenseNumber;
					var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : recordID,
					"ErrorDescription" : errorMessage, "runDate" : runDate};
			
					callToStoredProcedure(emseInsertParameters, "errorTableInsert");
			
					
					ELPLogging.debug("Deleting record from staging table since record is garbage value");
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
					continue;
				}
				//check if valid type class exists in the standard choice PCS_TYPE_CLASSES
				if(queryResult.typeClass != null && queryResult.typeClass != "TP")
				{
					ELPLogging.debug("Processed type class is invalid : "+ queryResult.typeClass);
					
					// Add to error log
					var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Invalid Type Class :"+queryResult.typeClass}
					updateStgRecord(updateParameters);

					continue;
				}

				if (queryResult.recordType == "3")
				{
					if (licenseData.checkLicenseNumber("", tmpQueryResult))
					{				
						processOPBoardRecords(queryResult);
					}
					else
					{
						var errorMessage = "License number already exists in Accela: "+queryResult.licenseNumber;
						var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : queryResult.licenseNumber,
						"ErrorDescription" : errorMessage, "runDate" : runDate};
				
						callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						
						var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage}
						updateStgRecord(updateParameters);
					}
				}
				else
				{
					processOPBoardRecords(queryResult);
				}
				
			}
			else
			{
				//check if valid type class exists in the standard choice PCS_TYPE_CLASSES
				if(!isValidTypeClass(queryResult))
				{
					var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Invalid Type Class :"+queryResult.typeClass}
					updateStgRecord(updateParameters);
					ELPLogging.debug("Processed type class is invalid : "+ queryResult.typeClass);
					continue;
				}
				
				
				// Defect #10373 : Do not process records for other record types as license for PD Limited License
				if((queryResult.recordType != null) && (queryResult.recordType == LICENSE_RECORD && getPCSApplicationType(queryResult) == LL_APP_TYPE)){
					ELPLogging.debug("Invalid record type for PD Limited Licenses board.");
					var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Invalid Record Type :"+queryResult.recordType}
					updateStgRecord(updateParameters);
					ELPLogging.debug("Processed Record Type is invalid : "+ queryResult.recordType);
					continue;
				}
			
				//Added for CR 274
				//Fetch record id for EIT/SIT application as this is not provided by the vendor.
				if ((queryResult.recordType != null) &&	(queryResult.recordType == EXAM_RECORD || queryResult.recordType == LICENSE_RECORD))
				{
					if(getPCSApplicationType(queryResult)==EIT_APP_TYPE || getPCSApplicationType(queryResult)==SIT_APP_TYPE)
					{
						ELPLogging.debug("-----------Processing EIT/SIT record-------------")
					var emseAppQueryParameters = {"SSN" : formatSSN(queryResult.socSecNumber),"FIRST_NAME" : queryResult.firstName, "LAST_NAME" : queryResult.lastName};
					var resultSetQuery = callToStoredProcedure(emseAppQueryParameters, "applicationQuery");
						ELPLogging.debug("-----------resultSetQuery-------------"+ resultSetQuery)
						queryResult.recordID = resultSetQuery.RECORDID;
						flagEITSIT = true;
					}
				}
				
				if ((queryResult.recordType != null) &&
					(queryResult.recordType == EXAM_RECORD || queryResult.recordType == LICENSE_RECORD) && 
					(queryResult.recordID != null || getPCSApplicationType(queryResult) == TP_APP_TYPE))
				{
					if (queryResult.recordType == LICENSE_RECORD)
					{
						ELPLogging.debug("Start Processing License Record : " + queryResult.recordID);
							
						// Set the flag to add application number into the monthly payment set.
						addRecordToMonthlyPaymentSetFlag = true;
						var recordID;
						//Populating the Record ID based on the Type class. This will be used in case of any validation failed. 
						if (getPCSApplicationType(queryResult) == TP_APP_TYPE)
						{
							recordID = queryResult.firstName + " " + queryResult.lastName;
						}
						else
						{
							recordID = queryResult.recordID;
						}
						
						// Required field validation.
						if (validateRequiredFields(queryResult))
						{
							ELPLogging.debug("Required field Validation Pass");							
							
							// Duplicate record check.
							if (!duplicateCheckForRecords(queryResult))
							{
								ELPLogging.debug("Duplicate check Pass");		
								// For EN Board's Temporary PERMIT
								//  1. EMSE will not do validation on Expiration date and License sequence Number.							
								if (getPCSApplicationType(queryResult) == TP_APP_TYPE)
								{
									ELPLogging.debug("Creating temp permit record");
									capID = createTempPermitRecord(queryResult);
									
									// Update the payment set flag and do not add record to monthly payment set. 
									addRecordToMonthlyPaymentSetFlag = false;
								}
								// For all Other records EMSE do validation on Expiration date and License sequence Number.
								else
								{
									var capListResult = aa.cap.getCapID(queryResult.recordID); 							
									
									if (capListResult.getSuccess())
									{
										capID = capListResult.getOutput();
										ELPLogging.debug("Processing Record ID : - " + capID);
										
										if ((getPCSApplicationType(queryResult) == EIT_APP_TYPE) || (getPCSApplicationType(queryResult) == SIT_APP_TYPE))
										{
											//For EIT/SIT License Sequence & Expiration Date range validation is not required.
											processLicenseRecord(queryResult, capID);			
										}
										else
										{
											//Processing other license record with License Sequence & Expiration Date range validation.
											processLicenseRecord(queryResult,capID, VALIDATE_LICENSE);
										}
									}
									else
									{
										// For Invalid Application number add error entry into stating error table and
										// delete record from PCS staging table. 
										ELPLogging.notify("Invalid Application Number: " + queryResult.recordID);      			
										var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid Application Number", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : recordID, "boardCode":queryResult.boardCode, "runDate" :runDate};
										
										// For record, required fields are not in PCS file:
										// 1. Add error entry into stating error table.
										// 2. Delete record from PCS staging table.
										updateStgRecord(emseUpdateParameters); 
										
										// Update the payment set flag and do not add record to monthly payment set.							
										addRecordToMonthlyPaymentSetFlag = false;
									}
								}
							}
							else
							{
								var recordID;
								if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								else if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								ELPLogging.notify("Duplicate PCS Record Data : " + queryResult.recordID);
														
								// Update the payment set flag and do not add record to monthly payment set.
								addRecordToMonthlyPaymentSetFlag = false;
										
								// Update the payment set flag and do not add record to monthly payment set.
								addRecordToMonthlyPaymentSetFlag = false;
							}
						}
						else
						{
							// For record, required fields are not in PCS file:
							// 1. Add error entry into stating error table.
							// 2. Delete record from PCS staging table						
							// Create the key value to get the list of required fields for the Record.
							if (queryResult.boardCode == "PY" || queryResult.boardCode == "HO")
							{
								arrayKey = queryResult.boardCode+"-"+queryResult.recordType;
							}
							else
							{
								arrayKey = queryResult.boardCode+"-"+getPCSApplicationType(queryResult) + "-"+queryResult.recordType;
							}
							
							ELPLogging.notify("PCS Record missing required fields : " + queryResult.recordID);
							var recordID;
							if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							
							if(queryResult.boardCode == "SA")
							{
								
								ELPLogging.debug("Starts updating PCS Staging table if Some field is/are not valid");
								
									ELPLogging.debug("Starts updating PCS Staging table if Some field is/are not valid");
							
							// defect#11194 fix to enter proper error message f missing fields by amol.redekar
								var appRequiredFieldsForSABoard =	"";
								if(queryResult.typeClass == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+"TYPE-CLASS" ;
								}if(queryResult.recordType == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",RECORD-TYPE";
								}if(queryResult.firstName == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",FIRST-NAME";
								}if(queryResult.lastName == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",LAST-NAME";
								}if(queryResult.dateOfBirth == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",dateOfBirth";
								}if(queryResult.socSecNumber == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",DATE-OF-BIRTH";
								}if(queryResult.addrs1stLn == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",ADDRS-1ST-LN";
								}if(queryResult.cityTwn == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",CITY-TWN";
								}if(queryResult.state == null){
								appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",STATE";
								}
							   
							   appRequiredFieldsForSABoard=appRequiredFieldsForSABoard.replace(',','');
							
								var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR"}
								updateStgRecord(updateParameters);
								ELPLogging.debug("Finish updating PCS table with invalid fields");
																			
								if(typeof requiredFieldArray[arrayKey] != "undefined")
								{
									var errorMessage = "PCS Record missing one or more required fields - " + appRequiredFieldsForSABoard;
									var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
								}
								else
								{
									var errorMessage = "PCS is not able to create the License Record for board:"+queryResult.boardCode;
									var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
								}
								callToStoredProcedure(emseInsertParameters, "errorTableInsert");
							}	
							else
							{
								if(typeof requiredFieldArray[arrayKey] != "undefined")
								{
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Record missing one or more required fields - " + requiredFieldArray[arrayKey], "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : recordID, "runDate" :runDate, "boardCode":queryResult.boardCode};
								}
								else
								{
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS is not able to create License Record for Board: "+ queryResult.boardCode , "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : recordID, "runDate" :runDate, "boardCode":queryResult.boardCode};
								}
							
								// For record, required fields are not in PCS file:
								// 1. Add error entry into stating error table.
								// 2. Delete record from PCS staging table.
								updateStgRecord(emseUpdateParameters);
							}
						}
					}
					else
					{
						// Update the payment set flag and do not add record to monthly payment set.
						addRecordToMonthlyPaymentSetFlag = false;
						
						// Required field validation for Exam Record.
						if (validateRequiredFields(queryResult))
						{
							ELPLogging.debug("Required field validation pass");
							var capListResult = aa.cap.getCapID(queryResult.recordID);					
						
							if (capListResult.getSuccess())
							{
								capID = capListResult.getOutput();
								
								// Duplicate record check.
								if (!duplicateCheckForRecords(queryResult))
								{
									// Processing the Exam record.
									if ((getPCSApplicationType(queryResult) == EIT_APP_TYPE) || (getPCSApplicationType(queryResult) == SIT_APP_TYPE) || (getPCSApplicationType(queryResult) == 'HO'))
									{
										processExamRecord(queryResult, capID);
									}
									else
									{
										processExamRecord(queryResult, capID, EXAM_WINDOW);
									}
								}
								else 
								{
									var recordID;
									if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
									{
										recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
									}
									else if((queryResult.firstName != null) && (queryResult.lastName != null))
									{
										recordID = queryResult.firstName+ " " +queryResult.lastName;
									}
									ELPLogging.notify("Duplicate PCS Record Data : " + queryResult.recordID);
															
									// Update the payment set flag and do not add record to monthly payment set.
									addRecordToMonthlyPaymentSetFlag = false;
								}
							}
							else
							{
								// For record, required fields are not in PCS file:
								// 1. Add error entry into stating error table.
								// 2. Delete record from PCS staging table. 
								ELPLogging.notify("Invalid Application Number: " + queryResult.recordID);      			
								var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid Application Number", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :runDate};
								
								updateStgRecord(emseUpdateParameters); 
								
								// Update the payment set flag and do not add record to monthly payment set.							
								addRecordToMonthlyPaymentSetFlag = false;
							}
						}
						else
						{
							// For record, required fields are not in PCS file:
							// 1. Add error entry into stating error table.
							// 2. Delete record from PCS staging table.   

							// Create the key value to get the list of required fields for the Record.
							if (queryResult.boardCode == "PY" || queryResult.boardCode == "HO")
							{
								arrayKey = queryResult.boardCode+"-"+queryResult.recordType;
							}
							else
							{
								arrayKey = queryResult.boardCode+"-"+getPCSApplicationType(queryResult) + "-"+queryResult.recordType;
							}
								ELPLogging.notify("PCS Record missing required fields : " + requiredFieldArray[arrayKey]);
								if(typeof requiredFieldArray[arrayKey] != "undefined")
								{
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Record missing one or more required fields - " + requiredFieldArray[arrayKey], "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "runDate" :runDate, "boardCode":queryResult.boardCode};
								}
								else
								{
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS is not able to create Exam Record for Board: "+queryResult.boardCode , "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "runDate" :runDate, "boardCode":queryResult.boardCode};
								}
								
								updateStgRecord(emseUpdateParameters);
							}
					}
				}
				else if(queryResult.recordType == APPLICATION_RECORD) 
				{
					// Required field validation for Application Record.
					if (validateRequiredFields(queryResult))
					{
						if(queryResult.boardCode == "PD")
						{
							addRecordToMonthlyPaymentSetFlag = false;
						}
						else
						{
							addRecordToMonthlyPaymentSetFlag = true;
						}
						
						ELPLogging.debug("Required field validation pass");
						
						// Duplicate Record check.
						if (!duplicateCheckForRecords(queryResult))
						{
							var capID = processApplicationRecord(queryResult);
							if(capID == null)
							{
								addRecordToMonthlyPaymentSetFlag = false;
							}
							else
							{
								ELPLogging.debug(" capID.getCustomID() :: " + capID.getCustomID() );
								//Process Exam Record
								if(queryResult.typeClass == LL_APP_TYPE)
								{
									processExamRecord(queryResult, capID);
									addRecordToMonthlyPaymentSetFlag = false;	
								}	
							}	
						}
						else
						{
							var recordID;
							if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							ELPLogging.notify("Duplicate PCS Record Data : " + queryResult.recordID);
													
							// Update the payment set flag and do not add record to monthly payment set.
							addRecordToMonthlyPaymentSetFlag = false;								
						}
					}
					else
					{
						// For record, required fields are not in PCS file:
						// 1. Add error entry into stating error table.
						// 2. Do Not Delete record from PCS staging table. 
						recordID = queryResult.firstName + " " + queryResult.lastName;
						
						
						var requiredFields = requiredFieldErrorMessage(queryResult);
						
						ELPLogging.notify("PCS Record missing required fields.");
						validationFlag = false;
						//Error Message should indicate which required field is missing
						var recordID;
						if((queryResult.boardCode != null) && (queryResult.typeClass != null))
						{
							recordID = queryResult.boardCode+"-"+queryResult.typeClass;
						}
						else if((queryResult.firstName != null) && (queryResult.lastName != null))
						{
							recordID = queryResult.firstName+ " " +queryResult.lastName;
						}
						
						ELPLogging.debug("PCS Record missing one or more required fields - " +requiredFields);
						//Add to Error Log
						var errorMessage = "PCS Record missing one or more required fields - : " + requiredFields;
						var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
						callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						
						var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : errorMessage, "intakeStatus": "PROCESSED_EMSE_ERROR", "recordID" : recordID, "boardCode":queryResult.boardCode, "runDate" :runDate};

						updateStgRecord(emseUpdateParameters); 						
						
						/*
						if (queryResult.boardCode == "SA") 
						{
							var appRequiredFieldsForSABoard =	"";
							if(queryResult.typeClass == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+"TYPE-CLASS" ;
							}if(queryResult.recordType == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",RECORD-TYPE";
							}if(queryResult.firstName == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",FIRST-NAME";
							}if(queryResult.lastName == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",LAST-NAME";
							}if(queryResult.dateOfBirth == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",DATE-OF-BIRTH";
							}if(queryResult.socSecNumber == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",SOC-SEC-NUMBER";
							}if(queryResult.addrs1stLn == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",ADDRS-1ST-LN";
							}if(queryResult.cashDate == null){
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard+",CASH-DATE";
							}
							appRequiredFieldsForSABoard=appRequiredFieldsForSABoard.replace(',','');
							
							ELPLogging.notify("PCS Record missing required fields.");
							validationFlag = false;
							//Error Message should indicate which required field is missing
							var recordID;
							if((queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							ELPLogging.debug("PCS Record missing one or more required fields - " +appRequiredFieldsForSABoard);
							//Add to Error Log
							var errorMessage = "PCS Record missing one or more required fields - : " + appRequiredFieldsForSABoard;
							var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							callToStoredProcedure(emseInsertParameters, "errorTableInsert");
							
						}
						
						
						else if ( queryResult.boardCode == "PD")		
						{				
							var appRequiredFieldsForPDBoard =	"typeClass: " + queryResult.typeClass + 
																",recordID : " + queryResult.recordID + 
																",recordType : " + queryResult.recordType +
																",firstName : "+queryResult.firstName+
																",lastName : "+queryResult.lastName+
																",dateOfBirth : XX XX XXXX"+
																",socSecNumber - XXX-XX-" + queryResult.socSecNumber.substr(queryResult.socSecNumber - 4)+
																",addrs1stLn : "+queryResult.addrs1stLn+
																",cityTwn : "+queryResult.cityTwn+
																",state : "+queryResult.state+
																",zipCodeA : "+queryResult.zipCodeA;
																	
							ELPLogging.notify("PCS Record missing required fields.");
							validationFlag = false;
							//Error Message should indicate which required field is missing
							var recordID;
							if((queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							ELPLogging.debug("PCS Record missing one or more required fields - " +appRequiredFieldsForPDBoard);
							//Add to Error Log
							var errorMessage = "PCS Record missing one or more required fields - : " + appRequiredFieldsForPDBoard;
							var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						}	
							// Create the key value to get the list of required fields for the Record.
						else if (queryResult.boardCode == "PY" || queryResult.boardCode == "HO")
							{
								arrayKey = queryResult.boardCode+"-"+queryResult.recordType;
							 
							ELPLogging.notify("PCS Record missing required fields : " + requiredFieldArray[arrayKey]);
							if(typeof requiredFieldArray[arrayKey] != "undefined")
							{
								var errorMessage = "PCS Record missing one or more required fields - " + requiredFieldArray[arrayKey];
								var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							}
							else
							{
								var errorMessage = "PCS is not able to create the Application Record for board:"+queryResult.boardCode;
								var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							}
							callToStoredProcedure(emseInsertParameters, "errorTableInsert");
							}*/
					}
				}
				else if( (queryResult.recordType != null) && (queryResult.recordType == LICENSE_RECORD) && (queryResult.boardCode == "PD"))
				{
					if (!licenseData.checkLicenseNumber("", tmpQueryResult))
					{				
					
						var errorMessage = "License number already exists in Accela: "+queryResult.licenseNumber;
						var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : queryResult.licenseNumber,
						"ErrorDescription" : errorMessage, "runDate" : runDate};
				
						callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						
						var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage}
						updateStgRecord(updateParameters);
					}
					else
					{			
						// Call Process Record Function For these Boards
						// Required field validation for License Record.
						if (validateRequiredFields(queryResult))
						{
							ELPLogging.debug("validating for required fields " + queryResult.boardCode + "board" );
							if(queryResult.boardCode == "PD")
							{
								addRecordToMonthlyPaymentSetFlag = false;
							}
							else
							{
								addRecordToMonthlyPaymentSetFlag = true;
							}
							
							ELPLogging.debug("Required field validation pass for " + queryResult.boardCode + "board" );
							
							// Duplicate Record check.
							if (!duplicateCheckForRecords(queryResult))
							{
								var capID = processApplicationRecord(queryResult);
								//ELPLogging.debug("queryResult.recordID is crated to be capID.getCustomID() === : " + capID.getCustomID());
								if(capID == null)
								{
									addRecordToMonthlyPaymentSetFlag = false;
								}
								else
								{
										//Process Exam and License Records
										if(getPCSApplicationType(queryResult) == PD_APP_TYPE)
										{
											queryResult.recordID = capID.getCustomID();
											var grad=processExamRecord(queryResult, capID);
											addRecordToMonthlyPaymentSetFlag = false;
											//Processing other license record with License Sequence & Expiration Date range validation.
									ELPLogging.debug("Grade Achived by Candidate :-" + grad );
											if(grad=="1"){
											processLicenseRecord(queryResult,capID, VALIDATE_LICENSE);	
											}
										}	
								}
							}
							else
							{
								var recordID;
								if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								else if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								ELPLogging.notify("Duplicate PCS Record Data : " + queryResult.recordID);
														
								// Update the payment set flag and do not add record to monthly payment set.
								addRecordToMonthlyPaymentSetFlag = false
							}
						}
						else
						{
							// For record, required fields are not in PCS file:
							// 1. Add error entry into stating error table. 					
							// Create the key value to get the list of required fields for the Record.
							arrayKey = queryResult.boardCode+"-"+getPCSApplicationType(queryResult) + "-"+queryResult.recordType;
							ELPLogging.notify("PCS Record missing required fields for license Record: " + requiredFieldArray[arrayKey]);
							
							ELPLogging.debug("Starts updating PCS Staging table if Some field is/are not valid");
							var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR"}
							updateStgRecord(updateParameters);
							ELPLogging.debug("Finish updating PCS table with invalid fields");
							
							
							var recordID;
							if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							
							if(typeof requiredFieldArray[arrayKey] != "undefined")
							{
								var errorMessage = "PCS Record missing one or more required fields  - " + requiredFieldArray[arrayKey];
								var emseInsertParameters = {"BatchInterfaceName" : dynamicParamObj.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							}
							else
							{
								var errorMessage = "PCS is not able to create the License Record for board: "+queryResult.boardCode;
								var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
							}
							callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						}
					}					   
				}
				else
				{
					// For record, required fields are not in PCS file:
					// 1. Add error entry into stating error table.
					// 2. Delete record from PCS staging table. 
					ELPLogging.notify("PCS Record missing required fields"); 
					ELPLogging.debug ("---" + queryResult.recordID + "---")
					// Update the Error table with Application Number if available else update with First and Last name. 
					if ((queryResult.recordID != null) && (queryResult.recordID != ""))
					{
						var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Record missing required field - Record Type", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.recordID, "boardCode":queryResult.boardCode};
					}
					else
					{
						if (flagEITSIT)
						{
							var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS-EIT/SIT : Application record not found", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.firstName + " " + queryResult.lastName, "boardCode":queryResult.boardCode};
						}
						else
						{
						var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Record missing required field - Application Number", "intakeStatus": "PROCESSED_EMSE_ERROR" , "recordID" : queryResult.firstName + " " + queryResult.lastName, "boardCode":queryResult.boardCode};
						}
					}
					updateStgRecord(emseUpdateParameters); 
				}
			}
		
			// Add the Application ID to Monthly payment set if flag found true.
			if (addRecordToMonthlyPaymentSetFlag)
			{
				// Add record to Monthly Payment set.
				var setName = getMonthlyPaymentSet(queryResult.boardCode);
				ELPLogging.debug("Adding record : " + capID + " to Monthly payment set " + setName);
				addApplicationRecordToMonthlyPaymentSet(setName, capID);
			}
		}
		catch(ex)
		{
			ELPLogging.debug(ex.toString());
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : "Error occurred while processing record"}
			updateStgRecord(updateParameters);
		}
	}
	
    ELPLogging.debug("**INFO: Record count actually processed: " + recCount);
    
	// Function sends email to respective Board Member.
	emailErrorReport(dbConn, stagingConfigObj, runDate,bCode);
	
	ELPLogging.debug("EMSE Processed all records successfully");
}	
catch(ex if ex instanceof ELPAccelaEMSEException)
{

    ELPLogging.fatal(ex.toString());
    aa.env.setValue("EMSEReturnCode", ex.getReturnCode()); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PCS_INTAKE aborted with " + ex.toString());
}
catch(ex)
{
    ELPLogging.fatal(ex.message);
    aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PCS_INTAKE  aborted with " + ex.message);
}
finally
{
    if (!ELPLogging.isFatal()) 
	{    
		// if fatal then return code already filled in
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
        aa.env.setValue("ScriptReturnCode","0");
        if (ELPLogging.getErrorCount() > 0) 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PCS_INTAKE completed with " + ELPLogging.getErrorCount() + " errors.");                    
        }
		else 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PCS_INTAKE completed with no errors.");            
        }
    }
    
	if (dbConn)
	{
		dbConn.close();
	}
    aa.env.setValue("logFile", ELPLogging.toJSON());
    aa.env.setValue("batchApplicationResult", JSON.stringify(batchAppResultObj));
}
/** 
 * @desc The purpose of this method is to validate the required fields for all board.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function validateRequiredFields(queryResult)
{
	// Validation flag indicates the validation outcome.
	var validationResult = false;
	
	switch (String(queryResult.boardCode))
	{
		case "PY":
			// Validate the Exam record.
			if (queryResult.recordType == EXAM_RECORD)
			{
				ELPLogging.debug("Start validating required fields for PY board's record : " + queryResult.recordID);
				validationResult = validateExamReqdFields(queryResult);
			}
			// Validate the License record.
			else if (queryResult.recordType == LICENSE_RECORD)
			{
				ELPLogging.debug("Start validating required fields for PY board's record : " + queryResult.recordID);
				validationResult = validateLicReqdFields(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for PY board.");
			}
			break;
		case "HO":
			// Validate the Exam record.
			if (queryResult.recordType == EXAM_RECORD)
			{
				ELPLogging.debug("Start validating required fields for HO board's record : " + queryResult.recordID);
				validationResult = validateExamReqdFields(queryResult);
			}
			// Validate the License record.
			else if (queryResult.recordType == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start validating required fields for HO board's record : " + queryResult.recordID);
				validationResult = validateAppReqdFields(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for HO board.");
			}
			break;
		case "EN":
			// Validate the Exam record.
			if (queryResult.recordType == EXAM_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EN board's record : " + queryResult.recordID);
				validationResult = validateExamReqdFields(queryResult);
			}
			// Validate the Application record.
			else if (queryResult.recordType == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EN board's record : " + queryResult.firstName + " " + queryResult.lastName);
				validationResult = requiredFieldValidationForENApplicationRecord(queryResult);
			}
			// Validate the License record.
			else if (queryResult.recordType == LICENSE_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EN board's record : " + queryResult.recordID);
				validationResult = validateLicReqdFields(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for EN board.");
			}
			break;
		case "AH":
		case "CH":
		case "EM":
			if (queryResult.recordType == LICENSE_RECORD)
			{
				ELPLogging.debug("Start validating required fields for " +queryResult.boardCode + " board's record : " + queryResult.firstName + " " + queryResult.lastName);
				validationResult = validateLicReqdFieldsAhChEm(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for AH board.");
			}
			break;
		case "PD":
			if (queryResult.recordType == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start validating required fields for " +queryResult.boardCode + " board's record : " + queryResult.firstName + " " + queryResult.lastName);
				ELPLogging.debug("The Type Class for PD Board is  " + getPCSApplicationType(queryResult));
				if(queryResult.typeClass == LL_APP_TYPE)
				{
					validationResult = requiredFieldValidationForPDLLApplicationRecord(queryResult);
				}
				else if(queryResult.typeClass == PD_APP_TYPE)
				{
					validationResult = requiredFieldValidationForPDPDApplicationRecord(queryResult);
				}
				else
				{
					//Log Error as no applicant record comes for Type Class PD 
					ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for PD board PD Type Class.");
				}
			}
			else if(queryResult.recordType == LICENSE_RECORD)
			{
				if(queryResult.typeClass == PD_APP_TYPE)
				{
					validationResult = requiredFieldValidationForPDPDLicenseRecord(queryResult);
				}
				else {
					ELPLogging.notify("Invalid Record type : " + queryResult.recordType + " for PD board Type Class PD.");
				}
			}
			break;
		case "SA":
			if (queryResult.recordType == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start validating required fields for " +queryResult.boardCode + " board's record : " + queryResult.firstName + " " + queryResult.lastName);
				if(getPCSApplicationType(queryResult) == SA_APP_TYPE)
				{
					validationResult = validateAppReqdFields(queryResult);
				}
			}
			else if(queryResult.recordType == LICENSE_RECORD)
			{
				if(getPCSApplicationType(queryResult) == SA_APP_TYPE)
				{
					ELPLogging.debug("Start validating required fields for SA board's License Record : " + queryResult.recordID);
					validationResult = requiredFieldValidationForSALicenseRecord(queryResult);
				}
			}
			break;
		default:
			ELPLogging.notify("Invalid board code : " + queryResult.boardCode + ".");
			break;
	}
	
	return validationResult;
}

/** 
 * @desc The purpose of this method is to validate the required fields for EN Board's Application record.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function requiredFieldValidationForENApplicationRecord(queryResult)
{
	// Common required field check for all Board's Application records.
	var validationResult = validateAppReqdFields(queryResult);
	if(validationResult)
	{
		if (queryResult.applicationType != null && queryResult.applicationType.length != 0)
		{
			validationResult = true;
		}
		else
		{
			validationResult = false;
		}
	}
	
	return validationResult;
}

/** 
 * @desc The purpose of this method is to validate the required fields for PD Board's(TypeClass "LL") Application record.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function requiredFieldValidationForPDLLApplicationRecord(queryResult)
{
	var validationResult = validateAppReqdFields(queryResult);
	if(validationResult)
	{
		if (queryResult.recordType != null &&
			queryResult.recordType.length != 0 &&
			queryResult.cashNumber != null &&
			queryResult.cashNumber.length != 0 &&
			queryResult.cashDate != null &&
			queryResult.examDate != null 
			)
		{
			validationResult = true;
		}
		else
		{
			validationResult = false;
		}
	}
	return validationResult;
}
/** 
 * @desc The purpose of this method is to validate the required fields for PD Board's(TypeClass "PD") Application record.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function requiredFieldValidationForPDPDApplicationRecord(queryResult)
{
	var validationResult = validateAppReqdFields(queryResult);
	if(validationResult)
	{
		if (queryResult.recordType != null &&
			queryResult.recordType.length != 0 &&
			queryResult.cashNumber != null &&
			queryResult.cashNumber.length != 0 &&
			queryResult.cashDate != null &&
			queryResult.examDate != null 
			)
		{
			validationResult = true;
		}
		else
		{
			validationResult = false;
		}
	}
	return validationResult;
}
/** 
 * @desc The purpose of this method is to validate the required fields for PD Board's(TypeClass "PD") License record.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function requiredFieldValidationForPDPDLicenseRecord(queryResult)
{
	var validationResult = validateLicReqdFields(queryResult);
	if(validationResult)
	{
		if (queryResult.dateOfBirth != null &&
			queryResult.addrs1stLn != null &&
			queryResult.addrs1stLn.length != 0 &&
			queryResult.cityTwn != null &&
			queryResult.cityTwn.length != 0 &&
			queryResult.state != null &&
			queryResult.state.length != 0 &&
			queryResult.zipCodeA != null &&
			queryResult.zipCodeA.length == 5 &&
			queryResult.examDate != null
			)
		{
			validationResult = true;
		}
		else
		{
			validationResult = false;
		}
	}
	return validationResult;
}


/** 
 * @desc The purpose of this method is to validate the required fields for SA Board's(TypeClass "SA") License record.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function requiredFieldValidationForSALicenseRecord(queryResult)
{
	var validationResult = validateLicReqdFields(queryResult);
	if(validationResult)
	{
		if (queryResult.examDate != null)
		{
			validationResult = true;
		}
		else
		{
			validationResult = false;
		}
	}
	
	return validationResult;
}

/** 
 * @desc The purpose of this method is to validate the exam record's required fields.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function validateExamReqdFields(queryResult)
{	
	var validationResult = false;

	if (queryResult.boardCode != null &&
		queryResult.boardCode.length != 0 &&
		queryResult.typeClass != null && 
		queryResult.typeClass.length != 0 &&
		queryResult.recordType != null &&
		queryResult.recordType.length != 0 &&
		queryResult.firstName != null &&
		queryResult.firstName.length != 0 &&
		queryResult.lastName != null &&
		queryResult.lastName.length != 0 &&
		queryResult.dateOfBirth != null &&
		queryResult.dateOfBirth.length != 0 &&
		queryResult.socSecNumber != null &&
		queryResult.socSecNumber.length == 9 &&
		queryResult.recordID != null &&
		queryResult.recordID.length != 0 &&
		queryResult.examDate != null)
	{
		if ((queryResult.prefCommunication != null && queryResult.prefCommunication.length != 0) && (queryResult.prefCommunication.toUpperCase() == "EMAIL"))
		{
			if (queryResult.emailID != null && queryResult.emailID.length != 0)
			{
				validationResult = true;
			}
		}
		else
		{
			validationResult = true;
		}
	}
	return validationResult;	
}

/** 
 * @desc The purpose of this method is to validate the Application record's common required fields for all Boards.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function validateAppReqdFields(queryResult)
{
	var validationResult = false;
	
	if (queryResult.boardCode != null &&
		queryResult.boardCode.length != 0 &&
		queryResult.typeClass != null && 
		queryResult.typeClass.length != 0 &&
		queryResult.firstName != null &&
		queryResult.firstName.length != 0 &&
		queryResult.lastName != null &&
		queryResult.lastName.length != 0 &&
		queryResult.dateOfBirth != null &&
		queryResult.socSecNumber != null &&
		queryResult.socSecNumber.length == 9 &&
		queryResult.addrs1stLn != null &&
		queryResult.addrs1stLn.length != 0 &&
		queryResult.cityTwn != null &&
		queryResult.cityTwn.length != 0 &&
		queryResult.state != null &&
		queryResult.state.length != 0 &&
		queryResult.zipCodeA != null &&
		queryResult.zipCodeA.length == 5)
	{
	
		if ((queryResult.prefCommunication != null && queryResult.prefCommunication.length !=0) && (queryResult.prefCommunication.toUpperCase() == "EMAIL"))
		{
			if (queryResult.emailID != null && queryResult.emailID.length != 0)
			{
				validationResult = true;
			}
		}
		else
		{
			validationResult = true;
		}
	}	
	
	return validationResult;
}

/** 
 * @desc The purpose of this method is to validate the license required field.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function validateLicReqdFields(queryResult)
{
	var validationResult = false;
	
	if (queryResult.boardCode != null &&
		queryResult.boardCode.length != 0 &&
		queryResult.typeClass != null && 
		queryResult.typeClass.length != 0 &&
		queryResult.recordType != null &&
		queryResult.recordType.length != 0 &&
		queryResult.firstName != null &&
		queryResult.firstName.length != 0 &&
		queryResult.lastName != null &&
		queryResult.lastName.length != 0 &&
		queryResult.socSecNumber != null &&
		queryResult.socSecNumber.length == 9 &&
		queryResult.licenseNumber != null && 
		queryResult.licenseNumber.length != 0 &&
		queryResult.licIssueDate != null &&
		queryResult.cashNumber != null &&
		queryResult.cashNumber.length != 0 &&
		queryResult.cashDate != null
		)
	{
		if ((queryResult.prefCommunication != null && queryResult.prefCommunication.length !=0) && (queryResult.prefCommunication.toUpperCase() == "EMAIL"))
		{
			if (queryResult.emailID != null && queryResult.emailID.length != 0)
			{
				validationResult = true;
			}
		}
		else
		{
			validationResult = true;
		}
		if ((validationResult && (getPCSApplicationType(queryResult) != TP_APP_TYPE) && (queryResult.boardCode != "PD") ))
		{
			if (queryResult.recordID != null && queryResult.recordID.length != 0)
			{
				validationResult = true;
			}
			else
			{
				validationResult = false;
			}
		}
	}

	return validationResult;
}

/** 
 * @desc The purpose of this method is to validate the license required field for PCS AH,CH,EM Boards.
 * @param {queryResult} queryResult - Contains dataSet of PCS Staging table.
 * @return {validationResult} validationResult - a boolean value true/false
 * @throws  N/A
 */
function validateLicReqdFieldsAhChEm(queryResult)
{
	// Common required field check for all Board's License records.
	var validationResult = validateLicReqdFields(queryResult)
	if(validationResult)
	{
		if (queryResult.dateOfBirth != null &&
			queryResult.addrs1stLn != null &&
			queryResult.addrs1stLn.length != 0 &&
			queryResult.cityTwn != null &&
			queryResult.cityTwn.length != 0 &&
			queryResult.state != null &&
			queryResult.state.length != 0 &&
			queryResult.zipCodeA != null &&
			queryResult.zipCodeA.length == 5 &&
			queryResult.examDate != null ) 
		{
			validationResult = true;
		}
		else
		{
				validationResult = false;
		}
	}
	return validationResult;
}

/** 
 * @desc The Method check for the duplicate record.
		 Method will return the flag for duplicate record.
			0 : It means record is not duplicate.
			1 : It means record is duplicate.	
 * @param queryResult : Contains dataSet of PCS Staging table.
 * @returns {Boolean} validation flag
 * @throws  N/A
 */
function duplicateCheckForRecords(queryResult)
{
	ELPLogging.debug("Checking duplicate record.-------");
	var dulicateFlag = false;

	// Parameters for Duplicate check stored procedure.
	if(queryResult.recordType == APPLICATION_RECORD)
	{
		if(getPCSApplicationType(queryResult) == LL_APP_TYPE)
		{
			var emseDupCheckParameters = {"socSecNumber" : queryResult.socSecNumber, "boardCode" : queryResult.boardCode,"typeClass" : (queryResult.typeClass).trim(), "examDate" : queryResult.examDate, "recordType" : queryResult.recordType,"rowNumber": queryResult.rowNumber, "runDate" : runDate, "firstName" : queryResult.firstName, "lastName" : queryResult.lastName};
		}
		else
		{
			var emseDupCheckParameters = {"socSecNumber" : queryResult.socSecNumber, "boardCode" : queryResult.boardCode,"typeClass" : (queryResult.typeClass).trim(),"recordType" : queryResult.recordType,"rowNumber": queryResult.rowNumber, "runDate" : runDate, "firstName" : queryResult.firstName, "lastName" : queryResult.lastName};
		}
	}	
	else if(queryResult.recordType == EXAM_RECORD)
	{
		var emseDupCheckParameters = {"typeClass" : (queryResult.typeClass).trim(), "boardCode" : queryResult.boardCode, "recordID" : queryResult.recordID, "examScore" : queryResult.examScore, "examDate" : queryResult.examDate, "rowNumber": queryResult.rowNumber, "runDate" : runDate, "recordType" : queryResult.recordType, "firstName" : queryResult.firstName, "lastName" : queryResult.lastName};		
	}
	else if(queryResult.recordType == LICENSE_RECORD && (queryResult.boardCode == "PD"))
	{
		var emseDupCheckParameters = {"socSecNumber": queryResult.socSecNumber , "boardCode":queryResult.boardCode, "typeClass":queryResult.typeClass.trim(), "licenseNumber":queryResult.licenseNumber, "rowNumber":queryResult.rowNumber, "runDate" : runDate, "recordType" : queryResult.recordType, "firstName" : queryResult.firstName, "lastName" : queryResult.lastName};
	}
	else if(queryResult.recordType == LICENSE_RECORD && (queryResult.boardCode == "EM" || queryResult.boardCode == "CH" || queryResult.boardCode == "AH"))
	{
		var recordID;
		if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
		{
			recordID = Number(queryResult.licenseNumber)+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
		}
		else if((queryResult.firstName != null) && (queryResult.lastName != null))
		{
			recordID = queryResult.firstName+ " " +queryResult.lastName;
		}
        
		var emseDupCheckParameters = { "socSecNumber": queryResult.socSecNumber , "boardCode":queryResult.boardCode, "typeClass":queryResult.typeClass.trim(), "licenseNumber":queryResult.licenseNumber, "recordID":recordID, "runDate" : runDate, "rowNumber":queryResult.rowNumber,"recordType" : queryResult.recordType};
	
	}
	else
	{
		var emseDupCheckParameters = {"socSecNumber" : queryResult.socSecNumber, "boardCode" : queryResult.boardCode, "recordID" : queryResult.recordID,"typeClass" : (queryResult.typeClass).trim(),"licenseNumber" : queryResult.licenseNumber,"rowNumber": queryResult.rowNumber, "runDate" : runDate, "recordType" : queryResult.recordType, "firstName" : queryResult.firstName, "lastName" : queryResult.lastName};
	}
	
	// Method will return the flag for duplicate record.
	// 0 : It mean record is not duplicate.
	// 1 : It means record is duplicate.	
	
	dulicateFlag = callToStoredProcedure(emseDupCheckParameters, "duplicateCheckQuery");
	ELPLogging.debug("Duplicate record flag = "+dulicateFlag.duplicateflag);
	return dulicateFlag.duplicateflag;;
}

/**
 * @desc This method create/process License and reference license record.
 * @param {queryResult} - Contains dataSet of PCS Staging table.
 * @param {validateLicese} if set to true then this method will validate the license number & expiration date.
 */
function processLicenseRecord(queryResult, capID, validateLicese)
{
	ELPLogging.debug("Processing License Record : " + queryResult.recordID);
	
	var licenseValidationResult = false;

	try
	{								
		// Check if exam data available on License Record. 
		// If exist create an exam entry on Application record.
		if(queryResult.boardCode != "PD")
		{
			licenseValidationResult = validateExamDataAvilableInLicenseRecord(queryResult);
			if (licenseValidationResult)
			{
				
					//Exam details present on the record, updating the exam entry on application record.
					ELPLogging.debug("Creating exam entry on application record while processing License record.")
					createExamRecord(capID,queryResult);
			}
		}
		//Perform additional business rule for EN board, PE and PLS type class
		if(getPCSApplicationType(queryResult)==PE_APP_TYPE || getPCSApplicationType(queryResult)==PLS_APP_TYPE)
		{
			
			 //	1. Check if the applicant has a temporary permit.
			 //	2. If applicant has a temporary permit number, expire that temp record.
			 //	3. Check if applicant has an EIT/SIT certificate.
			 //	4. If an EIT/SIT certificate present, upgrade the certificate record status to upgraded. 
			
			//If temp permit number is populated in the remittance file.
			
			//Grab if the application has temp permit
			var tempPermitNo=null;
			if(queryResult.tempPermitNo!=null && queryResult.tempPermitNo.length!=0)
			{
				//Update the Temp permit status to "Expired".
				tempPermitNo = (queryResult.tempPermitNo).trim();
			}
			else
			{
				tempPermitNo = getASI("Temporary Permit Number",capID);
			}
			ELPLogging.debug("Temporary permit no to expire : " + tempPermitNo + " for record # : " + capID);
			
			if(tempPermitNo!=null)
			{
				// Update the Temp permit status to "Expired".
				// Set the condition on PE/PLS application "Temp Permit already exists."
				ELPLogging.debug("Expiring temp permit#"+tempPermitNo);
				expireTempPermit(tempPermitNo);
			}
			//If certificate number captured by the PCS and is in the remittance file.				
			if(queryResult.certificateNo!=null)
			{ 
				//Update the certificate status to "Upgraded"
				ELPLogging.debug("Upgrading EIT/SIT certificate#"+queryResult.certificateNo);
				upgradeEITSITCertificate((queryResult.certificateNo).trim());
			}
		}
		
		//Call the method to get Application record details.
		var applicationTypeInfo = licenseData.getApplicationType(capID);
		ELPLogging.debug("cap Type Alias: " + licenseData.capTypeAlias);
		
		var lastSequenceNbr = null;
		var licenseNumberValidationResult = false;
		var expDateValidationResult = false;
		var newLicNumber = null;
		
		 // Do not validate expiration date range, when the expiration code is N/A for the record type
		 // Validating only the license number range to match with the standard choice "LICENSE_SEQUENCE_NUMBER" last sequence number			 
		
		// The IN parameter "validateLicese" is not passed from the caller method i.e variable is undefined.
		if(typeof validateLicese == 'undefined') 
		{
			//IN Parameters required for issuing the license when expiration is not applicable.
			var varLicParams = {"BOARD_CODE":queryResult.boardCode,"TYPE_CLASS":(queryResult.typeClass).trim(),"LICENSE_NUMBER":queryResult.licenseNumber,"LIC_EXP_DATE":"","ISSUE_DATE":queryResult.licIssueDate};
			
			//Fetch the license sequence number from the standard choice LICENSE_SEQUENCE_NUMBER and after processing it update the value with incremented license sequence number.
			lastSequenceNbr = getSharedDropDownDescriptionDetails(licenseData.capTypeAlias, "LICENSE_SEQUENCE_NUMBER");
			lastSequenceNbr=parseInt(lastSequenceNbr)+1;
			ELPLogging.debug("Fetched license sequence number as : " + lastSequenceNbr+ " for record type : "+licenseData.capTypeAlias);
			
			//Start Fix for CR 213
			/*1. For EIT/SIT Applications that are Approved (passed the exam)
					If "What is your eligibility for Surveyor/Engineer-in-Training Certification (See Instructions) Field populated" with "C"
						a. Do NOT create a license record
						b. Close the Application Record
						c. Do NOT add to the payment set
			*/
			var elgibilityQuestion;
			if(getPCSApplicationType(queryResult)==EIT_APP_TYPE)
			{
				elgibilityQuestion = "What is your eligibility for Engineer-in-Training Certification (See Instructions)";
			}
			if(getPCSApplicationType(queryResult)==SIT_APP_TYPE)
			{
				elgibilityQuestion = "What is your eligibility for Surveyor-in-Training Certification (See Instructions)";
			}
			
			
			var asiValue = getASI(elgibilityQuestion,capID);
			ELPLogging.debug("ASI value is : " + asiValue + " for record # : " + capID);
			if(asiValue == String("c) Not Eligible for Certification"))
			{
				//Do not create a license record, Close the Application Record && Do NOT add to the payment set.
				//Updating the stage table for processed record
				addRecordToMonthlyPaymentSetFlag = false;
				ELPLogging.debug("Activating task issuance");
				activateTaskByCapID("Issuance",capID);
				ELPLogging.debug("Updating Issuance to closed");
				updateTaskStatus("Issuance","Closed","Closed","Closed","", capID);
				var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
				updateStgRecord(updateParameters);
				ELPLogging.debug("Finished closing the application record.");
				return;
			}
			//End Fix for CR 213
			
			if(licenseData.checkLicenseNumber(capID, varLicParams))
			{		
				//Issuing the new license/certificate to applicant
				newLicNumber = licenseData.issueLicense(capID, varLicParams);
				addRecordToMonthlyPaymentSetFlag = true;
				
				if(!contactAddressDetailsArray.validAddress) 
				{
					var addressconditionComment = "adressline1: " + queryResult.addrs1stLn + ", addressLine2:" + queryResult.addrs2ndLn + ", city : " + queryResult.cityTwn + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
					addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,newLicNumber,CONDITION_TYPE,addressconditionComment); 
					ELPLogging.debug("Condition created");				
				}
								
				//Updating the license sequence number	
				ELPLogging.debug("Updating license sequence number");
				updateStandardChoice("LICENSE_SEQUENCE_NUMBER",licenseData.capTypeAlias,lastSequenceNbr);
						
				//Updating the stage table for processed record
				var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
				updateStgRecord(updateParameters);
				ELPLogging.debug("Finished issuing the certificate number.");
			}
			else
			{
				addRecordToMonthlyPaymentSetFlag = false;
				// delete record from PCS staging table.	    			
				var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "License already exists # " + licenseData.formatLicense(capID, varLicParams), "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :runDate};		
				updateStgRecord(emseUpdateParameters);
			}
			
		}
		else
		{
			//IN Parameters required for issuing the license.
			var varLicParams = {"BOARD_CODE":queryResult.boardCode,"TYPE_CLASS":(queryResult.typeClass).trim(),"LICENSE_NUMBER":queryResult.licenseNumber,"LIC_EXP_DATE":queryResult.licExpirDate,"ISSUE_DATE":queryResult.licIssueDate};
			
			if(licenseData.checkLicenseNumber(capID, varLicParams))
			{
				//Validating the license range & expiration date
				var licenseNumberValidationResult = licenseData.validatePCSData(capID, varLicParams);
				varLicParams.LIC_EXP_DATE = new Date(dateFormattedIntC(licenseNumberValidationResult.expDate, "MM/DD/YYYY"));
				//Defect #10308
				if(queryResult.boardCode == "PD" || queryResult.boardCode == "SA"){
					licenseNumberValidationResult.licenseExpirationFlag = true;
					ELPLogging.debug("Set the exp flag : " + licenseNumberValidationResult.licenseExpirationFlag);
				}
				//Defect #10308
				// For Valid expiration date process the License Record.
				if (licenseNumberValidationResult.licenseExpirationFlag)
				{
				ELPLogging.debug("License Number and Expiration validation Pass");
					
				// Create Transaction & Reference License records 
				// and update the work-flow task/status for Application record.
				newLicNumber = licenseData.issueLicense(capID, varLicParams);
				addRecordToMonthlyPaymentSetFlag = true;
				
				//Defect 9945
				ELPLogging.debug("newLicNumber"+newLicNumber);
				ELPLogging.debug("After license number contactAddressDetailsArray.validAddress : "+contactAddressDetailsArray.validAddress);
				
				if(!contactAddressDetailsArray.validAddress)
				{ 
					var addressconditionComment = "adressline1: " + queryResult.addrs1stLn + ", addressLine2:" + queryResult.addrs2ndLn + ", city : " + queryResult.cityTwn + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
					addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,newLicNumber,CONDITION_TYPE,addressconditionComment); 
				}
				// Check the license number flag. Flag can have 2 possible values
				// True : License sequence number in PCS intake file is equal and greater then the License sequence number in 
				// 	      LICENSE_SEQUENCE_NUMBER standard choice.
				// False : License sequence number in PCS intake file is less then the License sequence number in 
				// 	      LICENSE_SEQUENCE_NUMBER standard choice.
				// Raise a condition on reference license if license number flag is false.
				if (!licenseNumberValidationResult.licenseNumberFlag)
				{
					// Get the License professional number associated with transaction license. 
					var refLicProf = getRefLicenseProf(newLicNumber.getCustomID());
					
					if(refLicProf != null)
					{
						ELPLogging.debug("Adding condition on Ref License number : "  + refLicProf);
						var licSeqNum = refLicProf.getLicSeqNbr();
						var conditionComment = " with License# : " +licSeqNum+ " , First Name : " +queryResult.firstName+ " , Last Name : " + queryResult.lastName;
						// Method raise a condition on reference license and update the condition comment.
						addRefLicenseStandardCondition(capID, licSeqNum, CONDITION_TYPE, RESEND_CONDITION, conditionComment);
					}
				}
				else
				{
					// Update the License sequence number for License records where PCS License number and
					// License sequence number in standard choice are same.
					ELPLogging.debug("Updating the License sequence number");
					licenseData.updateLicenseSequenceNumbers();
				}
				
				// Update parameters to update the staging table for processed records.
				var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
				updateStgRecord(updateParameters);
				}
				else
				{
					// For Invalid License expiration date add error entry into error table and
					// delete record from PCS staging table.	
					ELPLogging.notify("Invalid Expiration Date for license record");      			
					var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid Expiration Date for license record", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :new Date(batchAppResultObj.runDate)};
					updateStgRecord(emseUpdateParameters);				
				}
			}
			else
			{
				addRecordToMonthlyPaymentSetFlag = false;
				// delete record from PCS staging table.	    			
				var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "License already exists # " + licenseData.formatLicense(capID, varLicParams), "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :runDate};		
				updateStgRecord(emseUpdateParameters);	
			}
		}
		
		//Updating ASI/ASIT values on license record.
		if(newLicNumber!=null)
		{
			ELPLogging.debug("Updating ASI/ASIT on License Record# "+newLicNumber);

			var sysDate = new Date();
			var sysDateMMDDYYYY = dateFormattedIntC(sysDate,"");
			ELPLogging.debug("sysDateMMDDYYYY # "+sysDateMMDDYYYY);
			ELPLogging.debug("newLicNumber.getCustomID() # "+newLicNumber.getCustomID());
			if(getPCSApplicationType(queryResult)==EIT_APP_TYPE)
			{
				updateASIValues(newLicNumber,"EIT CERTIFICATE","EIT Certificate Number",newLicNumber.getCustomID());
				updateASIValues(newLicNumber,"EIT CERTIFICATE","Certificate Date",sysDateMMDDYYYY);
			}
			//SIT
			if(getPCSApplicationType(queryResult)==SIT_APP_TYPE)
			{
				updateASIValues(newLicNumber,"CERTIFICATE","SIT Certificate Number",newLicNumber.getCustomID());
				updateASIValues(newLicNumber,"CERTIFICATE","Certificate Date",sysDateMMDDYYYY);
			}
			
			if(getPCSApplicationType(queryResult) == PD_APP_TYPE)
			{
				addRecordToMonthlyPaymentSetFlag = false;
				updateASIValues(newLicNumber, "APPLICATION TYPE", "Application Type", queryResult.applicationType); 
				updateASIValues(newLicNumber, "APPLICATION TYPE", "Limited License Number", queryResult.otherLicenseNumber); 
			}
			updateASIValuesOnLicense(queryResult,newLicNumber,capID);
			updateASITValuesOnLicense(queryResult,newLicNumber);
		}
		//Add fee on application record.
		if(addRecordToMonthlyPaymentSetFlag && queryResult.boardCode != "SA")
		{
			feeOnApplicationRecord(capID, queryResult.recordType);
		}
		
	} // END : try block.
	catch (ex)
	{
		ELPLogging.notify("Error/Exception occurred while processing license record  :  " + queryResult.recordID + " - Error Message: ", ex.message); 
		var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Error/Exception occurred while processing license record - Error Message: "+ex.message, "intakeStatus": "PROCESSED_EMSE_ERROR" , "recordID" : queryResult.recordID};
		updateStgRecord(emseUpdateParameters);
	}                		            	    		  				
	
	ELPLogging.debug("Finish Processing License Record : " + queryResult.recordID);

}

/**
 * @desc Method contains the Business logic for Exam record.
 * @param {queryResult} - Contains dataSet of PCS Staging table.
 * @param {examWindow} if examWindow present then it will perform the exam window related task.
 */
function processExamRecord(queryResult, capId, examWindow)
{
	ELPLogging.debug("Start Processing Exam Record : " + queryResult.recordID);
 var grad="";
 var flag =  true;
	// Method creates an Exam entry in Application record.
	if(queryResult.boardCode == "PD" && (queryResult.typeClass == "PD" || queryResult.typeClass == "LL")){
		var examName = getExamName(queryResult);
		var examNamesArray = getExamNameArrayForPD(examName);
		for(i in examNamesArray){
			grad=createExamRecordForPD(capId, queryResult, examNamesArray[i]); 
			if (grad == 0)
				flag = false;
		}
	}
	else {
		grad=createExamRecord(capId, queryResult); 
		if (grad == 0)
			flag = false;
	}
	
	
	//Update the workflow task status for HO board, if the applicant passed
	if(queryResult.boardCode=="HO")
	{
		if((Number(queryResult.writtenScore1) >=PASSING_SCORE) || (queryResult.examResult !=null && (queryResult.examResult).toUpperCase()==PASSING_GRADE))
		{
			// update the workflow for passed applicant
			ELPLogging.debug("Updating the work-flow task/status for passed applicant #"+capId);
			//Fixes for Defect#4738
			deactivateWFTask("Intake", capId);
			deactivateWFTask("Validate", capId);
			activateWFTask("Exam", capId);
			updateTaskStatus("Exam","Passed - Under Review","Exam Passed","Exam Passed","", capId);
			
			//Adding license fee on application record.
			feeOnApplicationRecord(capId, "3");
			
			var userName = getSharedDropDownDescriptionDetails(HO_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
			ELPLogging.debug("User Name is  : " + userName);
			assignTaskToUser(WFTASK, userName, capId)
		}
	}
	else if(queryResult.typeClass == LL_APP_TYPE)
	{
		if((queryResult.examResult !=null && (queryResult.examResult).toUpperCase()==PASSING_GRADE))
		{
			// update the workflow for passed applicant
			ELPLogging.debug("Updating the work-flow task/status for passed applicant #"+capId);
			deactivateWFTask("Intake", capId);
			deactivateWFTask("Validate", capId);
			activateWFTask("Exam", capId);
			updateTaskStatus("Exam","Passed - Under Review","Exam Passed","Exam Passed","", capId);
			
			var userName = getSharedDropDownDescriptionDetails(PD_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE); 
			ELPLogging.debug("User Name is  : " + userName);
			assignTaskToUser(WFTASK, userName, capId)
		}	
		else
		{
			var errorMessage = queryResult.boardCode + ":Exam Failed : Not Enough Score To Pass The Exam";
			// Inserting error in Error table.
			var recordID;
			if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
			{
				recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
			}
			else if((queryResult.firstName != null) && (queryResult.lastName != null))
			{
				recordID = queryResult.firstName+ " " +queryResult.lastName;
			}
			var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};	  
			callToStoredProcedure(emseInsertParameters, "errorTableInsert");
			flag = false;
		}
	}	
	
	if(typeof examWindow != 'undefined')
	{
		 
		 // Verify the exam window for PE/PLS record
		 // Check if the applicant has taken P&P exam 
		 //  If yes then check for the count for unsuccessful exam attempts on the application record,
		 //  If the failed attempts exceed 2 times, raise a condition on record and update the workflow task/status to "Exam/Board Review"
		ELPLogging.debug("Verify the exam window for PE/PLS record# "+capId);
		processExamWindowTask(capId);
	}			
	
	if (flag)
	{
		// Update parameters to update the staging table for processed records.
		var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
		updateStgRecord(updateParameters); 
	}
	
	ELPLogging.debug("Finished creating exam entry in Application record : " +capId);
	return grad;
}

/**
 * @desc This Method validates the exam window and if exam date does not fall in the window period it will raise condition.
 * @param {capId} - CAP ID . 
 */ 
function processExamWindowTask(capId)
{
	ELPLogging.debug("Verifying exam window for record ID : "+capId);
	// Accela common method gives the work-flow task/status for respective record.
	var workflowTaskStatusArray = loadTasks(capId);
	var statusDate=null;
	
	var boardStaff;
	if(queryResult.boardCode=="EN")
	{
		boardStaff = EN_BOARDSTAFF_ID;
	}
	else if(queryResult.boardCode=="PY")
	{
		boardStaff = PY_BOARDSTAFF_ID;
	}
	else if(queryResult.boardCode=="HO")
	{
		boardStaff = HO_BOARDSTAFF_ID;
	}	

	for (index in workflowTaskStatusArray)
	{		
		// To get the work-flow task/status update date. (WORKFLOW_STATUS = "Approved to Sit for Exam")
		if (workflowTaskStatusArray[index].status == WORKFLOW_STATUS) 
		{
			statusDate = workflowTaskStatusArray[index].statusdate;
			ELPLogging.debug("'Approved to Sit for Exam' status updated on : " + statusDate);
			break;
		}
	}
	
	// Check the Exam date should be fall with in 3 year period from exam task approval.
	if (checkWorkFlowTaskStatusUpdateInRange(statusDate,EXAM_WINDOW_THREE_YEAR)) 
	{
		
		if((Number(queryResult.writtenScore1) >=PASSING_SCORE) || (queryResult.examResult !=null && (queryResult.examResult).toUpperCase()==PASSING_GRADE))
		{
			ELPLogging.debug("Updating Exam workflow task");
			//update the workflow for passed applicant
			deactivateWFTask("Validate",capId);
			updateTaskStatus("Exam","Passed - Under Review","Exam Passed","Exam Passed","", capId);
		}
		else if((Number(queryResult.writtenScore1) < PASSING_SCORE) || (queryResult.examResult !=null && (queryResult.examResult).toUpperCase()!=PASSING_GRADE))
		{
			ELPLogging.debug("Exam date falls within 3 year period from exam task approval");
			var capScriptModel = aa.cap.getCap(capId).getOutput();
			
			var capModel = capScriptModel.getCapModel();
			
			var capTypeModel = capModel.getCapType();
			
			var capIdScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());

			var examModelList = aa.examination.getExaminationList(capIdScriptModel);
			
			var examScriptModel = examModelList.getOutput();
			
			var examAttempCount = 0;
			
			// Calculate the exam failed attempt count.
			for (index in  examScriptModel)
			{
				examAttempCount++;
			}
			
			ELPLogging.debug("Exam attempts count is : " + examAttempCount);
			
			var numOfAttempts;
			if(queryResult.boardCode=="EN")
			{
				numOfAttempts = EXAM_ATTEMPT_TWO;
				var conditionExamFailure = EN_PE_PLS_CONDITION_EXAM_FAILURE
				var capConditionComment = "Applicant has failed the exam 2 times";
			}
			else if(queryResult.boardCode=="PY")
			{
				numOfAttempts = EXAM_ATTEMPT_TWELVE;
				var conditionExamFailure = PY_CONDITION_EXAM_FAILURE;
				var capConditionComment = "Applicant has failed the exam 12 times";
			}
					
			// Raise a condition on Application record if exam attempt count is 2 for EN Board and 12 for PY Board.
			if (examAttempCount >= numOfAttempts)
			{
				ELPLogging.debug("Raising condition: "+conditionExamFailure+" on application record");

				addStdConditionByConditionNumber(CONDITION_TYPE, conditionExamFailure, capId);
				 
				 // Verify the exam window for PE/PLS record
				 // Check if the applicant has taken P&P exam 
				 //  If yes then check for the count for unsuccessful exam attempts on the application record,
				 //  If the failed attempts exceed 2 times, raise a condition on record and update the workflow task/status to "Validate/Board Review"
				
				ELPLogging.debug("Updating standard condition with comment : "+capConditionComment);
				
				editConditionComment(capId, conditionExamFailure, capConditionComment);
				
				// Update Workflow task/status and assign the Board Staff.
				updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capId);
				
				var userName = getSharedDropDownDescriptionDetails(boardStaff, TASK_ASSIGNMENT_STD_CHOICE);
				ELPLogging.debug("User Name is  : " + userName);
				assignTaskToUser(WFTASK, userName, capId)				
			}
		}
	}
	else
	{
		ELPLogging.debug("Raising condition : "+CONDITION_REGISTRATION_EXPIRED + " on application record for records which is not fall in 3 year window");
		
		// Raise a condition on application record if exam date does not fall in 3 year window.
		addStdConditionByConditionNumber(CONDITION_TYPE, CONDITION_REGISTRATION_EXPIRED, capId);
	
		editConditionComment(capId, CONDITION_REGISTRATION_EXPIRED, CONDITION_REGISTRATION_EXPIRED_COMMENT);
		
		// Update Workflow task/status and assign the Board Staff.
		var capConditionComment = CONDITION_REGISTRATION_EXPIRED_COMMENT;
		updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capId);
		var userName = getSharedDropDownDescriptionDetails(boardStaff, TASK_ASSIGNMENT_STD_CHOICE);
		assignTaskToUser(WFTASK, userName, capId)
	}
}

/**
 * @desc This method is created to:
	1. Validate Application record.
	2. For validated record, Create Application record.
 * @param {queryResult} Contains dataSet of PCS Staging table.
 * @return N/A
 */

function processApplicationRecord(queryResult) 
{
	var capID = null;
	//var contactAddressDetailsArray = new Array();
	
	// Validate the Application record fields like SSN, Address and Phone Number
	var applicationRecValidation = applicationRecordValidation(queryResult);
	contactAddressDetailsArray = performAddressValidation(queryResult);
	ELPLogging.debug("Test-1");
	// Process the records which are passed the Application record validation.
	if(applicationRecValidation.applicationRecordFlag && contactAddressDetailsArray != null)
	{	
	ELPLogging.debug("Test-2");
		//if((applicationRecValidation.applicationRecordFlag) && (contactAddressDetailsArray != null))
		
		ELPLogging.debug("Application record validation pass");
		//Create Application record.
		capID = createApplicationRecord(queryResult, contactAddressDetailsArray);
		ELPLogging.debug("capID return : "+capID);
		ELPLogging.debug("contactAddressDetailsArray : "+contactAddressDetailsArray);
		ELPLogging.debug("contactAddressDetailsArray.validAddress : "+contactAddressDetailsArray.validAddress);
		// Defect 9945
		if(!contactAddressDetailsArray.validAddress) 
		{
			var addressconditionComment = "adressline1: " + queryResult.addrs1stLn + ", addressLine2:" + queryResult.addrs2ndLn + ", city : " + queryResult.cityTwn + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
			addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capID,CONDITION_TYPE,addressconditionComment); 
			ELPLogging.debug("Condition created");				
		}
			
		if(capID)
		{
			ELPLogging.debug("New Application :  " +capID +" created.");
			
			if (applicationRecValidation.ssnFlag.ssnExpressionLogic)
			{
				ELPLogging.debug("SSN number failed the expression logic raising condition : "+SSN_CONDITION)
				
				var conditionComment = "First Name : " + queryResult.firstName + ", Last Name : " + queryResult.lastName;
				//Raise a Condition on reference License if Applicant's SSN number fails the SSN expression logic.
				addContactStdConditionOnRefContact(CONDITION_TYPE, SSN_CONDITION, conditionComment, capID);
				//Updating the error table for invalid SSN
				ELPLogging.debug("Updating the error table for invalid SSN in ELP_TBL_ERROR_STG_MA table.");
	
				var errorDescription = queryResult.boardCode + ":SSN number failed the expression logic for Reference Contacts "+ refContactNumber+ " with Record ID#"+capID.getCustomID();
				var errorTableUpdateParameters = {"BatchInterfaceName": dynamicParamObj.batchInterfaceName, "RecordID" : capID.getCustomID(), "ErrorDescription": errorDescription, "runDate": runDate};
				callToStoredProcedure(errorTableUpdateParameters, "errorTableInsert");
			}
			
			if(queryResult.tempPermitNo!=null)
			{
				ELPLogging.debug("Adding condition Temporary Permit Exists on record ID# "+ capID);
				//Raise a condition on application record if temp permit exists
				addStdConditionByConditionNumber(CONDITION_TEMP_PERMIT_TYPE, CONDITION_TEMP_PERMIT_EXISTS, capID);
				editConditionComment(capID, CONDITION_TEMP_PERMIT_EXISTS, CONDITION_TEMP_PERMIT_EXISTS_COMMENT);	
			}
			
			//Added for CR 274
			if(getPCSApplicationType(queryResult)==EIT_APP_TYPE || getPCSApplicationType(queryResult)==SIT_APP_TYPE)
			{
				//Advance the application record to 'Validate/Approved to sit for Exam' 
				// Send an email to applicatnt
				deactivateWFTask("Intake", capID);
				activateWFTask("Validate", capID);
				updateTaskStatus("Validate","Approved to Sit for Exam","","","", capID);
				sendEmailToApplicantApprovedToSit("Validate","Approved to Sit for Exam",capID);
				//activateWFTask("Exam", capID);
			}
			if(getPCSApplicationType(queryResult) == SA_APP_TYPE)
			{
				//Advance the application record to 'Validate/Under Review' 
				// Send an email to applicatnt
				deactivateWFTask("Intake", capID);
				activateWFTask("Validate", capID);
				updateTaskStatus("Validate","Under Review","","","", capID);
				sendEmailToApplicantApprovedToSit("Validate","Under Review",capID);
				
				var userName = getSharedDropDownDescriptionDetails("SA|ED", TASK_ASSIGNMENT_STD_CHOICE);
				assignTaskToUser("Validate", userName, capID);
			
				var department = "DPL/DPL/LIC/SM/STAFF/NA/NA";
				ELPLogging.debug("Setting the Dept Value.");
				updateTaskDeptt("Validate", department, capID); 
				
				//activateWFTask("Exam", capID);
			}
			// Updating the PCS staging table.
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"};
			updateStgRecord(updateParameters);
		}				
		else
		{
			// For Invalid Application number add error entry into error table and
			// delete record from PCS staging table.
			var errorDescription = "Unable to create Application record for " + queryResult.firstName + " " + queryResult.lastName;
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorDescription};
			updateStgRecord(updateParameters);
		}
	}
	
	return capID;
}


/**
 * @desc This method creates the exam entry on the application record.
 * @param {listOfExamNames} - Exam name list from Std Choice. 
 */
function getExamNameArrayForPD(listOfExamNames){
	var scanner = listOfExamNames.split("/");
	var examNameArray = new Array();
	for(i in scanner){
		examNameArray.push(scanner[i]);
	}
	return examNameArray;
}

/**
 * @desc This method creates the exam entry on the application record.
 * @param {capId} - CAP ID . 
 * @param {queryResult} - Contains dataSet of PCS Staging table.
 */
function createExamRecord(capId,queryResult)
{
	ELPLogging.debug("Creating exam entry in Application record : " +capId);
    // Create exam record for new application
    var newExamScriptModel = aa.examination.getExaminationModel().getOutput();
    newExamScriptModel.setServiceProviderCode("DPL");
    newExamScriptModel.setRequiredFlag("N");
	
    var examModel =  newExamScriptModel.getExaminationModel();
	var examName = getExamName(queryResult);
	ELPLogging.debug("Exam Name: "+examName);
    // Create Exam model for new record.
    examModel.setB1PerId1(capId.getID1());
    examModel.setB1PerId2(capId.getID2());
    examModel.setB1PerId3(capId.getID3());
    examModel.setExamName(examName);
	var passingScore = 0;
	ELPLogging.debug("Evaluating provider number for exam : "+examName);
	
	if(queryResult.boardCode == "PD")
	{
		ELPLogging.debug("examName : "+examName+", provider Name : " + PD_PROVIDER_NAME);
		var providerNo = getProviderNumber(examName, PD_PROVIDER_NAME);
		ELPLogging.debug("Provider Number: "+providerNo);

		examModel.setProviderName(PD_PROVIDER_NAME);
		
		if(examName == "Podiatrist Jurisprudence Exam" || examName == "NBPME Part III")
		{
			examModel.setGradingStyle(75);
		}
		else 
		{
			examModel.setGradingStyle("passfail");
		}
	}
	else if(queryResult.boardCode == "SA")
	{
		ELPLogging.debug("examName : "+examName+", provider Name : " + SA_PROVIDER_NAME);
		var providerNo = getProviderNumber(examName, SA_PROVIDER_NAME);
		ELPLogging.debug("Provider Number: "+providerNo);
		
		examModel.setProviderName(SA_PROVIDER_NAME);
	}
	else 
	{
		ELPLogging.debug("examName : "+examName+", provider Name : " + VENDOR);
		var providerNo = getProviderNumber(examName, VENDOR);
		ELPLogging.debug("Provider Number: "+providerNo);
		
		examModel.setProviderName(VENDOR);
	}
	
	if(providerNo != null){
		examModel.setProviderNo(providerNo);
	}
	
	newExamScriptModel.setAuditStatus("A");
	//examModel.setGradingStyle("passfail");
	var grad = 0;// Defualt to "Fail"

	if(Number(queryResult.writtenScore1) != null)
	{
		if(queryResult.typeClass == PD_APP_TYPE)
		{
			passingScore = PD_PASSING_SCORE;
			if(queryResult.reciprocity == null	&& (Number(queryResult.writtenScore1) >=PD_PASSING_SCORE && Number(queryResult.writtenScore2) >=PD_PASSING_SCORE))
			{
				ELPLogging.debug("Exam validation passed for User: " + queryResult.firstName);
				grad = 1;
			}
			else if(queryResult.reciprocity != null && Number(queryResult.writtenScore2) >= PD_PASSING_SCORE)
			{
				ELPLogging.debug("Exam validation passed for User: " + queryResult.firstName);
				grad = 1;
			}
			else
			{
				var errorMessage = queryResult.boardCode + ":Exam Failed : Not Enough Score To Pass The Exam";
				// Inserting error in Error table.
				var recordID;
				if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				else if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};	  
				callToStoredProcedure(emseInsertParameters, "errorTableInsert");
				var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage,"recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :runDate}
				updateStgRecord(updateParameters);
			}
			
		}
		
		else if(queryResult.typeClass == SA_APP_TYPE)
		{
			passingScore = SA_PASSING_SCORE;
			if(Number(queryResult.writtenScore1) >= SA_PASSING_SCORE)
			{
				ELPLogging.debug("Exam validation passed  for User: " + queryResult.firstName);
				grad = 1;
			}
			else
			{
				var errorMessage = queryResult.boardCode + ":Exam Failed : Not Enough Score To Pass The Exam";
				// Inserting error in Error table.
				var recordID;
				if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				else if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};	  
				callToStoredProcedure(emseInsertParameters, "errorTableInsert");
			}
		}
		
		else if((Number(queryResult.writtenScore1) >= PASSING_SCORE) || (queryResult.examResult !=null && (queryResult.examResult).toUpperCase()==PASSING_GRADE))
		{
			passingScore = PASSING_SCORE;
			grad = 1;
			ELPLogging.debug("Exam validation passed  for User: " + queryResult.firstName);
		}
	}
	
	
	if(queryResult.boardCode =='PY')
	{
		ELPLogging.debug("Number(queryResult.writtenScore1): "+Number(queryResult.writtenScore1));
		examModel.setFinalScore(Number(queryResult.writtenScore1));
	}	
	/* else
	{
		examModel.setGradingStyle("passfail");
		examModel.setFinalScore(grad);
	} */
	
	if(grad==1)
	{
		 examModel.setExamStatus("PCOMPLETED");
	}
	else
    {
        examModel.setExamStatus("PENDING");
    }

	examModel.setFinalScore(Number(queryResult.writtenScore1));
	examModel.setPassingScore(passingScore);
	examModel.setExamDate(queryResult.examDate);
    examModel.setEntityType("CAP_EXAM");

    // Creating Exam record.
    var statusResult = aa.examination.createExaminationModel(newExamScriptModel);
    if (!statusResult.getSuccess())
	{
		returnException = new ELPAccelaEMSEException("Error Creating Examination "+ statusResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.error(returnException.toString());   	
    }
	return grad;
}

/**
 * @desc This method creates the exam entry on the application record.
 * @param {capId} - CAP ID . 
 * @param {queryResult} - Contains dataSet of PCS Staging table.
 * @param {examName} - Contains examName for PD board.
 */
function createExamRecordForPD(capId,queryResult, examName)
{
	ELPLogging.debug("Creating exam entry in Application record : " +capId);
    // Create exam record for new application
    var newExamScriptModel = aa.examination.getExaminationModel().getOutput();
    newExamScriptModel.setServiceProviderCode("DPL");
    newExamScriptModel.setRequiredFlag("N");
	
    var examModel =  newExamScriptModel.getExaminationModel();
	ELPLogging.debug("Exam Name: "+examName);
    // Create Exam model for new record.
    examModel.setB1PerId1(capId.getID1());
    examModel.setB1PerId2(capId.getID2());
    examModel.setB1PerId3(capId.getID3());
    examModel.setExamName(examName);
	var passingScore = 0;
	ELPLogging.debug("Evaluating provider number for exam : "+examName);
	
	if(queryResult.boardCode == "PD")
	{
		ELPLogging.debug("examName : "+examName+", provider Name : " + PD_PROVIDER_NAME);

		var providerNo = getProviderNumber(examName, PD_PROVIDER_NAME);
	
		ELPLogging.debug("Provider Number: "+providerNo);

		examModel.setProviderName(PD_PROVIDER_NAME);
		
		
		if(examName == "Podiatrist Jurisprudence Exam" || examName == "NBPME Part III")
		{
			examModel.setGradingStyle(75);
		}
		else 
		{
			examModel.setGradingStyle("passfail");
		}
	}
	
	if(providerNo != null){
		examModel.setProviderNo(providerNo);
	}
	
    newExamScriptModel.setAuditStatus("A");
	var grad = 0;// Defualt to "Fail"

	if(Number(queryResult.writtenScore1) != null)
	{
		if(queryResult.typeClass == PD_APP_TYPE)
		{
			passingScore = PD_PASSING_SCORE;
			
			if(queryResult.reciprocity == null	&& (Number(queryResult.writtenScore1) >=PD_PASSING_SCORE && Number(queryResult.writtenScore2) >=PD_PASSING_SCORE))
			{
				ELPLogging.debug("Exam validation passed for User: " + queryResult.firstName);
				grad = 1;
			}
			else if(queryResult.reciprocity != null && Number(queryResult.writtenScore2) >= PD_PASSING_SCORE)
			{
				ELPLogging.debug("Exam validation passed for User: " + queryResult.firstName);
				grad = 1;
			}
			else
			{
				var errorMessage = queryResult.boardCode + ":Exam Failed : Not Enough Score To Pass The Exam";
				// Inserting error in Error table.
				var recordID;
				if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				else if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};	  
				callToStoredProcedure(emseInsertParameters, "errorTableInsert");
				var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorMessage,"recordID" : queryResult.recordID, "boardCode":queryResult.boardCode, "runDate" :runDate}
				updateStgRecord(updateParameters);
			}
			
		}
		else if((Number(queryResult.writtenScore1) >=PASSING_SCORE) || (queryResult.examResult !=null && (queryResult.examResult).toUpperCase()==PASSING_GRADE))
		{
			passingScore = PASSING_SCORE;
			grad = 1;
			ELPLogging.debug("Exam validation passed  for User: " + queryResult.firstName);
		}
	}
	
	
	if(queryResult.reciprocity != null && Number(queryResult.writtenScore2) >= PD_PASSING_SCORE && Number(queryResult.writtenScore1) == null && grad == 0)
	{
		ELPLogging.debug("Exam validation passed for User: " + queryResult.firstName);
		grad = 1;
	}
	
	if(grad==1)
	{
		 examModel.setExamStatus("PCOMPLETED");
	}
	else
    {
        examModel.setExamStatus("PENDING");
    }
	
	if(examName == "Podiatrist Jurisprudence Exam" || examName == "NBPME Part III")
	{
		examModel.setFinalScore(Number(queryResult.writtenScore1));
	}
	else 
	{
		if (grad==1)
		{
			examModel.setFinalScore(1);
		}
		else
		{
			examModel.setFinalScore(0);
		}
		
	}
	
	examModel.setPassingScore(passingScore);
	examModel.setExamDate(queryResult.examDate);
    examModel.setEntityType("CAP_EXAM");

    // Creating Exam record.
    var statusResult = aa.examination.createExaminationModel(newExamScriptModel);
    if (!statusResult.getSuccess())
	{
		returnException = new ELPAccelaEMSEException("Error Creating Examination "+ statusResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.error(returnException.toString());   	
    }
	return grad;
}
/** 
 * @desc This Method takes the typeClass and return the corresponding Exam Name.
 * @param {typeClass} typeClass - contains the Type Class eg. M1, J1 
 * @throws  N/A
 */
function getExamName(queryResult)
{
    var examName = "";
	var appType = getPCSApplicationType(queryResult);
	ELPLogging.debug("appType : " + appType);
	// Creating 'Board Code-Type class' key to get exam name.
	var examCode = queryResult.boardCode+ "-" + appType;
	var examNameStdChoice = "EXAM_NAME_STD_CHOICE";
	
	// Load the exam name store in EXAM_NAME_STD_CHOICE standard choice.
	examName = getSharedDropDownDescriptionDetails(examCode, examNameStdChoice);
	ELPLogging.debug("examCode : " + examCode + ", Retrieved exam Name : " + examName);
    return examName;
}

/**
 * @desc This method is created to create the application record.
 * @param {queryResult} contains the row set that needs to process.
 * @return {capIDModel}
 */

function createApplicationRecord(queryResult, contactAddressDetailsArray) 
{
	ELPLogging.debug("Creating new Application record.");
	if((queryResult.boardCode == PD_APP_TYPE) || (queryResult.boardCode == SA_APP_TYPE))
	{
		var capAlias = queryResult.boardCode + "-"+ queryResult.typeClass;
		ELPLogging.debug("Creating capAlias  " + capAlias);
	}
	else
	{
		var capAlias = queryResult.boardCode + "-"+getPCSApplicationType(queryResult);
		ELPLogging.debug("Creating capAlias  " + capAlias);
	}
	
	ELPLogging.debug("Creating Application Record for  : " + capAlias);
	
	// Get the cap type based on 'Board-Type class' key.
	var pCapType = getSharedDropDownDescriptionDetails(capAlias, CAP_TYPE_STD_CHOICE);
	
	//Format the primary contact in US format (###)###-#### before creating the application record.
	
	//Defect #9783
	if(queryResult.primaryPhone != null)
	{
		queryResult.primaryPhone = formatPhoneNumber(queryResult.primaryPhone);
		ELPLogging.debug("-----------------------------Formatted primary contact----------------- "+queryResult.primaryPhone);
	}
	
	ELPLogging.debug("pCapType for is : " + pCapType);
	var capIDModel = createCap(pCapType, null);
	ELPLogging.debug("Application Record created with ID : " + capIDModel);
	aa.cap.updateAccessByACA(capIDModel, "N");
	if (capIDModel)
    {
    	var capResult = aa.cap.getCap(capIDModel);
        var capScriptModel = capResult.getOutput();
		
        if (capScriptModel)
        {
			//set values for CAP record
            var capModel = capScriptModel.getCapModel();
        	capModel.setCapStatus("Submitted");
            capModel.setCapClass("COMPLETE");
            capModel.setReportedDate(new java.util.Date());
            capModel.setFileDate(new java.util.Date());

            var capTypeModel = capModel.getCapType();
            capTypeModel.setCategory("License");
			
            capModel.setCapType(capTypeModel);

            var editResult = aa.cap.editCapByPK(capModel);
			
            if(!editResult.getSuccess())
            {
            	ELPLogging.debug("Error editing the cap record for "+capIDModel+": "+editResult.getErrorMessage());
            }
			
			ELPLogging.debug("Adding fee on application record : "+ capIDModel);
			
			//Updating ASIT value
			updateASITValuesOnApplicationForPDorSA(queryResult,capIDModel);
		
			//Updating ASI values
			updateASIValuesOnApplicationForPDorSA(queryResult,capIDModel);
			// Adding Application fee on Application record.
			feeOnApplicationRecord(capIDModel, queryResult.recordType);
			//Updating EXAM VENDOR CASH INFO ASIT on Application record
			if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
			{
				updateExamVendorCashInfo(capIDModel);
			}
		}
        else
        {
        	ELPLogging.debug("Error retrieving the cap "+capIDModel+": "+capResult.getErrorMessage());
		}
		
		createCapContactForRecord(capIDModel, queryResult, contactAddressDetailsArray);
		//creating current employer contact for PE/LS & TP record
		if(getPCSApplicationType(queryResult)==PE_APP_TYPE || getPCSApplicationType(queryResult)==PLS_APP_TYPE || getPCSApplicationType(queryResult)==TP_APP_TYPE)
		{
			if (queryResult.presEmpCompName != null &&
				queryResult.presEmpCompName.trim().length != 0 &&
				queryResult.presEmpAddrLn1 != null &&
				queryResult.presEmpAddrLn1.trim().length != 0 &&
				queryResult.presEmpCity != null &&
				queryResult.presEmpCity.trim().length != 0 &&
				queryResult.presEmpState != null &&
				queryResult.presEmpState.trim().length != 0 &&
				queryResult.presEmpZipCodeA != null &&
				queryResult.presEmpZipCodeA.trim().length == 5)
			{
				createCurrentEmpContactForRecord(capIDModel, queryResult);
			}
		}
		
		ELPLogging.debug("Successfully cap contact created ");
		
		// Assign the intake application to Staff member in order to proceed with the business flow.
		var userName = "";
		if(queryResult.boardCode=="EN")
		{
			userName = getSharedDropDownDescriptionDetails(EN_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
			assignTaskToUser("Intake", userName, capIDModel);
			
			var department = "DPL/DPL/LIC/OCC./STAFF/NA/NA";
			ELPLogging.debug("Setting the Dept Value.");
			updateTaskDeptt("Intake", department, capIDModel);
		}
		else if(queryResult.boardCode=="HO")
		{
			userName = getSharedDropDownDescriptionDetails(HO_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
			assignTaskToUser("Intake", userName, capIDModel);
			
			var department = "DPL/DPL/LIC/SM/STAFF/NA/NA";
			ELPLogging.debug("Setting the Dept Value.");
			updateTaskDeptt("Intake", department, capIDModel); 	
		}
		
		//set the short notes field via Interface to record portlet
		var capDetailScriptModel = aa.cap.getCapDetail(capIDModel).getOutput();
		var capDetailModel = capDetailScriptModel.getCapDetailModel();
		capDetailModel.setShortNotes(queryResult.boardCode);
		
		var editCapDetailResult = aa.cap.editCapDetail(capDetailModel);

		if(!editCapDetailResult.getSuccess())
		{
			ELPLogging.debug("Error updating Short Notes for "+capDetailModel+": "+editCapDetailResult.getErrorMessage());
		}
		else {
			ELPLogging.debug("Successfully updated Short Notes for record ID : " +capIDModel);
		}
	}
    else
    {
    	ELPLogging.debug("Error creating the Application Record.");
	}
	
	return capIDModel;
}

/** 
 * @desc The purpose of this method is to update the ASI values on application record.
 * @param {queryResult} queryResult - contains the row set of result.
 * @param {capIDModel} capIDModel - contains Cap ID.
 * @throws  N/A
 */
function updateASIValuesOnApplicationForPDorSA(queryResult,capIDModel)
{
	var noFeeCollectedObject;
			
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollectedObject = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollectedObject = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollectedObject = "Spouse";
	}
	else
	{
		noFeeCollectedObject = "N/A"
	}
	
	var eligibility = "";
	var profQualifications = "";
	var comityQualifications = "";
	
	if(queryResult.eligibility!=null && queryResult.eligibility.length !=0)
	{
		eligibility = getSharedDropDownDescriptionDetails("E-"+queryResult.eligibility,stdChoiceExamQualification);
	}
	if(queryResult.profQualifications!=null && queryResult.profQualifications.length !=0)
	{
		profQualifications = getSharedDropDownDescriptionDetails("P-"+queryResult.profQualifications,stdChoiceExamQualification);
	}
	if(queryResult.comityQualifications!=null && queryResult.comityQualifications.length !=0)
	{
		comityQualifications = getSharedDropDownDescriptionDetails("C-"+queryResult.comityQualifications,stdChoiceExamQualification);
	}
	
	ELPLogging.debug("eligibility : "+ eligibility + ", profQualifications: "+profQualifications +", comityQualifications: "+comityQualifications);
	switch (String(queryResult.boardCode))
	{
		case "PD":
			updateASIValuesForPDRecords(queryResult,capIDModel,noFeeCollectedObject);
			break;
		case "SA":
			if(getPCSApplicationType(queryResult)==SA_APP_TYPE)
			{
				//Defect# 9804
				var applicationTypeASI = "";
				if(queryResult.reciprocity == "  " || queryResult.reciprocity == null){
					applicationTypeASI = "Sanitarian Certification";
					ELPLogging.debug("Set Application type ASI as : " + applicationTypeASI);
				}
				else {
					applicationTypeASI = "Certification By Reciprocity";
					ELPLogging.debug("Set Application type ASI as : " + applicationTypeASI);
				}
				updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
				updateASIValues(capIDModel, "APPLICATION TYPE", "This application is for", applicationTypeASI);
			}
			break;
	}
	//EIT
	if(getPCSApplicationType(queryResult)==EIT_APP_TYPE)
	{
		updateASIValues(capIDModel,"EXPERIENCE","Are you currently certified as an Engineer-in-Training in any other states?",queryResult.certifiedInOtherState)
		updateASIValues(capIDModel,"UNLICENSED EXPERIENCE","Was any engineering experience obtained under the direct supervision of an unlicensed individual?",queryResult.expUnlicensedIndividual)
		updateASIValues(capIDModel,"ELIGIBILITY FOR EIT","What is your eligibility for Engineer-in-Training Certification (See Instructions)",eligibility);
		updateASIValues(capIDModel,"PREVIOUS FE","Taken NCEES sanctioned FE exam?",queryResult.prevFEExamTaken);
		updateASIValues(capIDModel,"CERTIFICATE","Certificate Number",queryResult.certificateNo);
		updateASIValues(capIDModel,"CERTIFICATE","Certificate Issue Date",queryResult.certificateIssueDate);
		updateASIValues(capIDModel,"PCS APPLICATION NUMBER","PCS Application Number",queryResult.applicationNumber);
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
	}
	//SIT
	if(getPCSApplicationType(queryResult)==SIT_APP_TYPE)
	{
		updateASIValues(capIDModel,"SIT - EXPERIENCE","Are you currently certified as an Surveyor-in-Training in any other states?",queryResult.certifiedInOtherState);
		updateASIValues(capIDModel,"ELIGIBILITY","What is your eligibility for Surveyor-in-Training Certification (See Instructions)",eligibility);
		updateASIValues(capIDModel,"UNLICENSED EXPERIENCE","Was any land surveying experience obtained under direct supervision of an unlicensed individual?",queryResult.expUnlicensedIndividual)
		updateASIValues(capIDModel,"PREVIOUS FS","Taken NCEES sanctioned FS exam?",queryResult.prevFSExamTaken);
		updateASIValues(capIDModel,"PCS APPLICATION NUMBER","PCS Application Number",queryResult.applicationNumber);
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
	}
	//PE
	if(getPCSApplicationType(queryResult)==PE_APP_TYPE)
	{
	
		updateASIValues(capIDModel,"QUALIFICATION FOR PE","What best describes your qualifications to become a Professional Engineer? (See Instructions)",profQualifications);
		
		var examDiscipline = "";
		/* if(queryResult.examDiscipline!=null && queryResult.examDiscipline.length !=0)
		{
			examDiscipline = getSharedDropDownDescriptionDetails(queryResult.examDiscipline,stdChoiceExamQualification);
		} */
		
		var STDCHOICEASI = "PE_QUALIFICATION_FOR_PE_BRANCH";
		examDiscipline = getSharedDropDownValue(queryResult.typeClass,STDCHOICEASI);
		
		updateASIValues(capIDModel,"QUALIFICATION FOR PE","Based on education, experience & exams, which branch/discipline best matches your qualifications?",examDiscipline);
		updateASIValues(capIDModel,"QUALIFICATION FOR PE","From Comity, what best describes your qualifications to become a PE? (See Instructions)  ",comityQualifications);
		updateASIValues(capIDModel,"SCHOOLS/COLLEGES ATTENDED","Was your degree earned outside of the US?",queryResult.degreeEarnedOutside);
		updateASIValues(capIDModel,"SCHOOLS/COLLEGES ATTENDED","Has your degree been evaluated by NCEES or a Board approved evaluator?",queryResult.degreeEvaluated);
		updateASIValues(capIDModel,"EXPERIENCE","Was more than 50% of your experience gained outside of the US?",queryResult.expGainedOutside);
		updateASIValues(capIDModel,"EXPERIENCE","Was any engineering experience obtained under the direct supervision of an unlicensed individual?",queryResult.expUnlicensedIndividual);
		
		updateASIValues(capIDModel,"PREVIOUS FE","Taken NCEES sanctioned FE exam?  (If Yes, provide verification)",queryResult.prevFEExamTaken);
		updateASIValues(capIDModel,"PREVIOUS P&P","Taken NCEES sanctioned P&P PE exam? (If Yes, provide verification)",queryResult.prevPEExamTaken);
		updateASIValues(capIDModel,"TEMPORARY PERMIT #","Temporary Permit Number",queryResult.tempPermitNo);	
		updateASIValues(capIDModel,"CERTIFICATE","Certificate Number",queryResult.certificateNo)
		updateASIValues(capIDModel,"CERTIFICATE","Certificate Issue Date",queryResult.certificateIssueDate)
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);	
		updateASIValues(capIDModel,"PCS APPLICATION NUMBER","PCS Application Number",queryResult.applicationNumber);
	}
	//PLS
	if(getPCSApplicationType(queryResult)==PLS_APP_TYPE)
	{
		updateASIValues(capIDModel,"PLS QUALIFICATIONS","What best describes your qualifications to become a Professional Land Surveyor? (See Instructions)",profQualifications);
		updateASIValues(capIDModel,"PLS QUALIFICATIONS","From Comity, what best describes your qualifications to become a PLS? (See Instructions)",comityQualifications);
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
		updateASIValues(capIDModel,"TEMPORARY PERMIT #","Temporary Permit Number",queryResult.tempPermitNo);
		
		updateASIValues(capIDModel,"PREVIOUS FS","Taken NCEES sanctioned FS exam? (If Yes, provide verification)",queryResult.prevFSExamTaken)
		updateASIValues(capIDModel,"PREVIOUS P&P","Taken NCEES sanctioned P&P LS exam? (If Yes, provide verification)",queryResult.prevLSExamTaken);
		
		updateASIValues(capIDModel,"MA LS EXAM","Have you previously taken the Massachusetts's State Specific  (Jurisprudence) Land Surveying Exam?",queryResult.prevMALSExamTaken)
		
		updateASIValues(capIDModel,"SCHOOLS/COLLEGES ATTENDED","Was your degree earned outside of the US?",queryResult.degreeEarnedOutside);
		updateASIValues(capIDModel,"SCHOOLS/COLLEGES ATTENDED","Has your degree been evaluated by NCEES or a Board approved evaluator?",queryResult.degreeEvaluated);

		updateASIValues(capIDModel,"EXPERIENCE","Was more than 50% of your experience gained outside of the US?",queryResult.expGainedOutside);
		updateASIValues(capIDModel,"EXPERIENCE","Was any land surveying experience obtained under direct supervision of an unlicensed individual?",queryResult.expUnlicensedIndividual);
	}
	//HO
	if(queryResult.boardCode=="HO")
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
	}
	//TP
	if(getPCSApplicationType(queryResult)==TP_APP_TYPE)
	{
	    var tempPermitExpDateLocal="";
		var tempPermitStartDateLocal="";
		//ELPLogging.debug("tempPermitExpDateLocal  otside localllllllllllll  "+ queryResult.tempPermitExpiryDate+"   " );
		if(queryResult.tempPermitExpiryDate != null){
		tempPermitExpDateLocal=jsDateToMMDDYYYY(queryResult.tempPermitExpiryDate);
		//ELPLogging.debug(tempPermitExpDateLocal+"tempPermitExpDateLocal     queryResult.tempPermitExpiryDate : localllllllllllll  "+ queryResult.tempPermitExpiryDate );
		}
		if(queryResult.tempPermitStartDate != null){
		tempPermitStartDateLocal=jsDateToMMDDYYYY(queryResult.tempPermitStartDate);
		}
		updateASIValues(capIDModel,"PERMIT INFORMATION","Have you submitted a Comity application for registration in Massachusetts?",queryResult.haveSubmittedComityApp);
		updateASIValues(capIDModel,"PERMIT INFORMATION","On what date do you wish your 30 DAY PERMIT to start?",tempPermitStartDateLocal);
		updateASIValues(capIDModel,"PERMIT INFORMATION","Do you have sufficient knowledge of MA Regulations to correctly conduct the work planned in MA?",queryResult.eligibleForConductingWork);
		updateASIValues(capIDModel,"PERMIT INFORMATION","If not, do you have arrangements for assistance from a Registered Professional Engineer in MA?",queryResult.arrangedAssistance);
		updateASIValues(capIDModel,"PREVIOUS MA APP/TEMP PERMIT","Have you had a previous temporary permit in Massachusetts?",queryResult.hadPrevTempPermit);
		updateASIValues(capIDModel,"PREVIOUS MA APP/TEMP PERMIT","If so, when did it expire?",tempPermitExpDateLocal);
	}

}

/** 
 * @desc The purpose of this method is to update the ASI values on application record.
 * @param {queryResult} queryResult - contains the row set of result.
 * @param {capIDModel} capIDModel - contains Cap ID.
 * @param {noFeeCollectedObject} noFeeCollectedObject - noFeeCollected Value.
 * @throws  N/A
 */
function updateASIValuesForPDRecords(queryResult,capIDModel,noFeeCollectedObject)
{
	//LL_APP_TYPE
	if(queryResult.typeClass==LL_APP_TYPE)
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);		
		var didApplyPreviously; 
		if(queryResult.appliedOrDeniedProfLic == null || queryResult.appliedOrDeniedProfLic == " ") {
			didApplyPreviously = "N";
		}
		else {
			didApplyPreviously = "Y";
		}
		updateASIValues(capIDModel, "APPLICATION", "Have you previously filed an application?", didApplyPreviously); // From which Field in intake file are we getting this?, also ASI group can not be predected as information is not there for PD Board in AA
	}
	//PD_APP_TYPE
	if(queryResult.typeClass==PD_APP_TYPE)
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
		updateASIValues(capIDModel, "APPLICATION TYPE", "Application Type", queryResult.applicationType); 
		updateASIValues(capIDModel, "APPLICATION TYPE"	, "Have you previously filed an application?", queryResult.appliedOrDeniedProfLic); 
		if((queryResult.appliedOrDeniedProfLic!=null) && (queryResult.appliedOrDeniedProfLic == "Y"))
		{
			updateASIValues(capIDModel, "APPLICATION TYPE", "If applicable, what is your Massachusetts Limited License Number", queryResult.otherLicenseNumber);
		}
	}
}

/** 
 * @desc The purpose of this method is to update the ASIT table value on application record.
 * @param {queryResult} queryResult - contains the row set of result.
 * @param {capIDModel} capIDModel - contains Cap ID.
 * @throws  N/A
 */
function updateASITValuesOnApplicationForPDorSA(queryResult,capIDModel)
{
	var expCategory = "";
	if(queryResult.expCategory !=null && queryResult.expCategory.length !=0)
	{
		expCategory = getSharedDropDownDescriptionDetails(queryResult.expCategory,stdChoiceExamQualification);
	}

	if (queryResult.boardCode == 'EN' && queryResult.typeClass == 'CH')
    {
        pcsAppType = 'EN-PE';
    }
    else
    {            
        pcsAppType = getSharedDropDownDescription(PCS_TYPE_CLASSES_STD_CHOICE,(queryResult.typeClass).trim());
    }
    
	ELPLogging.debug("pcsAppType : "+ pcsAppType)
	// If prevExamScore1 && prevPPExamScore field value is one among the below option then update the ASIT value accordingly.
		//"00000" : Ignore
		//"00001" : Pass
		//"00002" : Fail
		//"00003" : Disqualified
		var prevExamScore1 = "";
		
		if(queryResult.prevExamScore1!=null)
		{
			if(queryResult.prevExamScore1 == "00000")
			{
				//Do nothing
				prevExamScore1 = "";
			}
			if(queryResult.prevExamScore1 == "00001")
			{
				prevExamScore1 = "Pass";
			}
			if(queryResult.prevExamScore1 == "00002")
			{
				prevExamScore1 = "Fail";
			}
			if(queryResult.prevExamScore1 == "00003")
			{
				prevExamScore1 = "Disqualified";
			}
		}
		
		ELPLogging.debug("----------------prevExamScore1 :------------------ "+prevExamScore1);
		var prevPPExamScore = "";
		if(queryResult.prevPPExamScore!=null)
		{
			if(queryResult.prevPPExamScore == "00000")
			{
				//Do nothing
				prevPPExamScore = "";
			}
			if(queryResult.prevPPExamScore == "00001")
			{
				prevPPExamScore = "Pass";
			}
			if(queryResult.prevPPExamScore == "00002")
			{
				prevPPExamScore = "Fail";
			}
			if(queryResult.prevPPExamScore == "00003")
			{
				prevPPExamScore = "Disqualified";
			}
		}
	
	//EIT ASIT TABLE
	if(pcsAppType == EIT_APP_TYPE)
	{
		var tableExperienceValuesArray = {};
			tableExperienceValuesArray["Certificate Number (if applicable)"] = (queryResult.otherCertificateNumber!=null)?String(queryResult.otherCertificateNumber):"";
			tableExperienceValuesArray["Jurisdiction"] = (queryResult.jurisdiction!=null)?String(queryResult.jurisdiction):"";
			tableExperienceValuesArray["(a) Engagement Number (See Instructions)"] = (queryResult.engagementNo!=null)?String(queryResult.engagementNo):"";
			tableExperienceValuesArray["(b) Experience Category (See Instructions)"] = expCategory;	
			tableExperienceValuesArray["(c ) Beginning Date (month/Year)"] = (queryResult.engagementStDate!=null)?String(queryResult.engagementStDate):"";
			tableExperienceValuesArray["(d) Ending Date (month/Year)"] = (queryResult.engagementEndDate!=null)?String(queryResult.engagementEndDate):"";
			tableExperienceValuesArray["(e) Elapsed Time (for this engagement)"] = (queryResult.engagementElapsedTime!=null)?String(queryResult.engagementElapsedTime):"";
			tableExperienceValuesArray["(f) Pre-Responsible Charge (Engineering Experience)"] = (queryResult.preResponsibleCharge!=null)?String(queryResult.preResponsibleCharge):"";
			tableExperienceValuesArray["(g) Responsible Charge (Engineering Experience)"] = (queryResult.responsibleCharge!=null && queryResult.responsibleCharge.length!=0)?queryResult.responsibleCharge:"";
			tableExperienceValuesArray["(h) Total Engineering Experience (sum of columns f, g)"] = (queryResult.totalExperience!=null)?String(queryResult.totalExperience):"";
			tableExperienceValuesArray["Other (non-engineering & academic)"] = (queryResult.otherExperience!=null)?String(queryResult.otherExperience):"";
			tableExperienceValuesArray["Supervising Engineer (See Instructions)"] = (queryResult.supervisingEngineer!=null)?String(queryResult.supervisingEngineer):"";
			tableExperienceValuesArray["Your Employer (See Instructions)"] = (queryResult.employer!=null)?String(queryResult.employer):"";
		
		addASITValueToRecord("EXPERIENCE", tableExperienceValuesArray, capIDModel);
		
		var tablePrevFEExamValuesArray = {};
			tablePrevFEExamValuesArray["Jurisdiction"] = (queryResult.prevExamJuri!=null)?String(queryResult.prevExamJuri):"";
			tablePrevFEExamValuesArray["Date of Exam"] = (queryResult.prevExamDate1!=null && queryResult.prevExamDate1.length!=0)?jsDateToMMDDYYYY(queryResult.prevExamDate1):"";
			tablePrevFEExamValuesArray["Exam Score"] = prevExamScore1;
			tablePrevFEExamValuesArray["Certificate Number (if applicable)"] = (queryResult.prevExamCertNo!=null)?String(queryResult.prevExamCertNo):"";
			
		addASITValueToRecord("PREVIOUS FE", tablePrevFEExamValuesArray, capIDModel);

	}
	//SIT ASIT TABLE
	if(pcsAppType==SIT_APP_TYPE)
	{
		var tableSITExperienceValuesArray = {};
			tableSITExperienceValuesArray["Certificate Number (if applicable)"] = (queryResult.otherCertificateNumber!=null)?String(queryResult.otherCertificateNumber):"";
			tableSITExperienceValuesArray["Jurisdiction"] = (queryResult.jurisdiction!=null)?String(queryResult.jurisdiction):"";
		
		addASITValueToRecord("SIT - EXPERIENCE", tableSITExperienceValuesArray, capIDModel);
		
		var tableExperienceValuesArray = {};
			tableExperienceValuesArray["(a) Engagement Number (See Instructions)"] = (queryResult.engagementNo!=null)?String(queryResult.engagementNo):"";
			tableExperienceValuesArray["(b) Experience Category (See Instructions)"] = expCategory;
			tableExperienceValuesArray["(c ) Beginning Date (month/Year)"] = (queryResult.engagementStDate!=null)?String(queryResult.engagementStDate):"";
			tableExperienceValuesArray["(d) Ending Date (month/Year)"] = (queryResult.engagementEndDate!=null)?String(queryResult.engagementEndDate):"";
			tableExperienceValuesArray["(e) Elapsed Time (for this engagement)"] = (queryResult.engagementElapsedTime!=null)?String(queryResult.engagementElapsedTime):"";
			tableExperienceValuesArray["(f) Pre-Responsible Charge (Surveying Experience)"] = (queryResult.preResponsibleCharge!=null)?String(queryResult.preResponsibleCharge):"";
			tableExperienceValuesArray["(g) Responsible Charge (Surveying Experience)"] = (queryResult.responsibleCharge!=null)?String(queryResult.responsibleCharge):"";
			tableExperienceValuesArray["(h) Total Surveying Experience (sum of columns f, g)"] = (queryResult.totalExperience!=null)?String(queryResult.totalExperience):"";
			tableExperienceValuesArray["Other (non-surveying & academic)"] = (queryResult.otherExperience!=null)?String(queryResult.otherExperience):"";
			tableExperienceValuesArray["Supervising Land Surveyor (See Instructions)"] = (queryResult.supervisingEngineer!=null)?String(queryResult.supervisingEngineer):"";
			tableExperienceValuesArray["Your Employer (See Instructions)"] = (queryResult.employer!=null)?String(queryResult.employer):"";
		
		addASITValueToRecord("EXPERIENCE TABLE", tableExperienceValuesArray, capIDModel);

		var tablePrevFSExamValuesArray = {};
			tablePrevFSExamValuesArray["Jurisdiction"] = (queryResult.prevExamJuri!=null)?String(queryResult.prevExamJuri):"";
			tablePrevFSExamValuesArray["Date of Exam"] = (queryResult.prevExamDate1!=null && queryResult.prevExamDate1.length!=0)?jsDateToMMDDYYYY(queryResult.prevExamDate1):"";
			tablePrevFSExamValuesArray["Exam Score"] = prevExamScore1
			tablePrevFSExamValuesArray["Certificate Number (if applicable)"] = (queryResult.prevExamCertNo!=null)?String(queryResult.prevExamCertNo):"";
			
		addASITValueToRecord("PREVIOUS FS", tablePrevFSExamValuesArray, capIDModel);
		 
	}
	//PE ASIT TABLE
	if(pcsAppType==PE_APP_TYPE)
	{
		var tableExperienceValuesArray = {};
			tableExperienceValuesArray["(a) Engagement Number (See Instructions)"] = (queryResult.engagementNo!=null)?String(queryResult.engagementNo):"";
			tableExperienceValuesArray["(b) Experience Category (See Instructions)"] = expCategory;
			tableExperienceValuesArray["(c ) Beginning Date (month/Year)"] = (queryResult.engagementStDate!=null)?String(queryResult.engagementStDate):"";
			tableExperienceValuesArray["(d) Ending Date (month/Year)"] = (queryResult.engagementEndDate!=null)?String(queryResult.engagementEndDate):"";
			tableExperienceValuesArray["(e) Elapsed Time (for this engagement)"] = (queryResult.engagementElapsedTime!=null)?String(queryResult.engagementElapsedTime):"";
			tableExperienceValuesArray["(f) Pre-Responsible Charge (Engineering Experience)"] = (queryResult.preResponsibleCharge!=null)?String(queryResult.preResponsibleCharge):"";
			tableExperienceValuesArray["(g) Responsible Charge (Engineering Experience)"] = (queryResult.responsibleCharge!=null)?String(queryResult.responsibleCharge):"";
			tableExperienceValuesArray["(h) Professional (Engineering Experience)"] = (queryResult.profExperience!=null)?String(queryResult.profExperience):"";
			tableExperienceValuesArray["(i) Total Engineering Experience (sum of columns f, g, h)"] = (queryResult.totalExperience!=null)?String(queryResult.totalExperience):"";
			tableExperienceValuesArray["(j) Other (non-engineering & academic)"] = (queryResult.otherExperience!=null)?String(queryResult.otherExperience):"";
			tableExperienceValuesArray["(k) Supervising Engineer (See Instructions)"] = (queryResult.supervisingEngineer!=null)?String(queryResult.supervisingEngineer):"";
			tableExperienceValuesArray["(l) Your Employer (See Instructions)"] = (queryResult.employer!=null)?String(queryResult.employer):"";
		
		addASITValueToRecord("EXPERIENCE", tableExperienceValuesArray, capIDModel);
		
		var tablePrevFEExamValuesArray = {};
			tablePrevFEExamValuesArray["Jurisdiction"] = (queryResult.prevExamJuri!=null)?String(queryResult.prevExamJuri):"";
			tablePrevFEExamValuesArray["Date of Exam"] = (queryResult.prevExamDate1!=null && queryResult.prevExamDate1.length!=0)?jsDateToMMDDYYYY(queryResult.prevExamDate1):"";
			tablePrevFEExamValuesArray["Branch / Discipline"] = (queryResult.prevFEExamDiscipline!=null)?String(queryResult.prevFEExamDiscipline):"";
			tablePrevFEExamValuesArray["Exam Score"] = prevExamScore1;
			tablePrevFEExamValuesArray["Certificate Number (if applicable)"] = (queryResult.prevExamCertNo!=null)?String(queryResult.prevExamCertNo):"";
			
		addASITValueToRecord("PREVIOUS FE", tablePrevFEExamValuesArray, capIDModel);


		var tablePrevPPExamValuesArray = {};
			tablePrevPPExamValuesArray["Jurisdiction"] = (queryResult.prevPPExamJuri!=null)?String(queryResult.prevPPExamJuri):"";
			tablePrevPPExamValuesArray["Most Recent Date"] = (queryResult.prevPPExamDt!=null && queryResult.prevPPExamDt.length!=0)?jsDateToMMDDYYYY(queryResult.prevPPExamDt):"";
			tablePrevPPExamValuesArray["Times Taken"] = (queryResult.prevPPExamTimesTaken!=null)?String(queryResult.prevPPExamTimesTaken):"";
			tablePrevPPExamValuesArray["Exam Hours"] = (queryResult.prevPPExamDuration!=null)?String(queryResult.prevPPExamDuration):"";
			tablePrevPPExamValuesArray["Exam Score"] = prevPPExamScore;
			tablePrevPPExamValuesArray["NCEES Candidate ID Number"] = (queryResult.prevCandidateIDNumber!=null)?String(queryResult.prevCandidateIDNumber):"";
			
		addASITValueToRecord("PREVIOUS P&P", tablePrevPPExamValuesArray, capIDModel);
		
		var tableReferencesValuesArray = {};
			tableReferencesValuesArray["Name"] = (queryResult.referencesName!=null)?String(queryResult.referencesName):"";
			tableReferencesValuesArray["Address & Telephone #"] = (queryResult.referencesContactInfo!=null)?String(queryResult.referencesContactInfo):"";
			tableReferencesValuesArray["PE"] = (queryResult.referencesType!=null)?String(queryResult.referencesType):"";
			tableReferencesValuesArray["In which state licensed?"] = "";
			tableReferencesValuesArray["License Number"] = "";
			tableReferencesValuesArray["License Issue Date"] = "";
		
		addASITValueToRecord("REFERENCES", tableReferencesValuesArray, capIDModel);	
	}
	
	//PLS ASIT TABLE
	if(pcsAppType==PLS_APP_TYPE)
	{
		
		var tablePrevMALSValuesArray = {};
			tablePrevMALSValuesArray["Most Recent Date"] = (queryResult.prevMALSExamDt!=null && queryResult.prevMALSExamDt.length!=0)?jsDateToMMDDYYYY(queryResult.prevMALSExamDt):"";
			tablePrevMALSValuesArray["Times Taken"] = (queryResult.prevMALSExamTimesTaken!=null)?String(queryResult.prevMALSExamTimesTaken):"";
			tablePrevMALSValuesArray["Exam Score"] = (queryResult.prevMALSExamScore!=null && queryResult.prevMALSExamScore!=0)?String(queryResult.prevMALSExamScore):"";
			
		addASITValueToRecord("MA LS EXAM", tablePrevMALSValuesArray, capIDModel);
		
	
		var tableExperienceValuesArray = {};
			tableExperienceValuesArray["(a) Engagement Number (See Instructions)"] = (queryResult.engagementNo!=null)?String(queryResult.engagementNo):"";
			tableExperienceValuesArray["(b) Experience Category (See Instructions)"] = expCategory;
			tableExperienceValuesArray["(c ) Beginning Date (month/Year)"] = (queryResult.engagementStDate!=null)?String(queryResult.engagementStDate):"";
			tableExperienceValuesArray["(d) Ending Date (month/Year)"] = (queryResult.engagementEndDate!=null)?String(queryResult.engagementEndDate):"";
			tableExperienceValuesArray["(e) Elapsed Time (for this engagement)"] = (queryResult.engagementElapsedTime!=null)?String(queryResult.engagementElapsedTime):"";
			tableExperienceValuesArray["(f) Pre-Responsible Charge (Surveying Experience)"] = (queryResult.preResponsibleCharge!=null)?String(queryResult.preResponsibleCharge):"";
			tableExperienceValuesArray["g) Responsible Charge (Surveying Experience)"] = (queryResult.responsibleCharge!=null)?String(queryResult.responsibleCharge):"";
			tableExperienceValuesArray["(h) Professional (Surveying Experience)"] = (queryResult.profExperience!=null)?String(queryResult.profExperience):"";
			tableExperienceValuesArray["(i) Total Surveying Experience (sum of columns f, g, h)"] = (queryResult.totalExperience!=null)?String(queryResult.totalExperience):"";
			tableExperienceValuesArray["(j) Other (non-surveying & academic)"] = (queryResult.otherExperience!=null)?String(queryResult.otherExperience):"";
			tableExperienceValuesArray["(k) Supervising Land Surveyor (See Instructions)"] = (queryResult.supervisingEngineer!=null)?String(queryResult.supervisingEngineer):"";
			tableExperienceValuesArray["(l) Your Employer (See Instructions)"] = (queryResult.employer!=null)?String(queryResult.employer):"";
		
		addASITValueToRecord("EXPERIENCE TABLE", tableExperienceValuesArray, capIDModel);
 
		var tablePrevFSExamValuesArray = {};
			tablePrevFSExamValuesArray["Jurisdiction"] = (queryResult.prevExamJuri!=null)?String(queryResult.prevExamJuri):"";
			tablePrevFSExamValuesArray["Date of Exam"] = (queryResult.prevExamDate1!=null && queryResult.prevExamDate1.length!=0)?jsDateToMMDDYYYY(queryResult.prevExamDate1):"";
			tablePrevFSExamValuesArray["Exam Score"] = prevExamScore1
			tablePrevFSExamValuesArray["Certificate Number (if applicable)"] = (queryResult.prevExamCertNo!=null)?String(queryResult.prevExamCertNo):"";
			
		addASITValueToRecord("PREVIOUS FS", tablePrevFSExamValuesArray, capIDModel);
		
		var tablePrevPPExamValuesArray = {};
			tablePrevPPExamValuesArray["Jurisdiction"] = (queryResult.prevPPExamJuri!=null)?String(queryResult.prevPPExamJuri):"";
			tablePrevPPExamValuesArray["Most Recent Date"] = (queryResult.prevPPExamDt!=null && queryResult.prevPPExamDt.length!=0)?jsDateToMMDDYYYY(queryResult.prevPPExamDt):"";
			tablePrevPPExamValuesArray["Times Taken"] = (queryResult.prevPPExamTimesTaken!=null)?String(queryResult.prevPPExamTimesTaken):"";
			tablePrevPPExamValuesArray["Exam Hours"] = (queryResult.prevPPExamDuration!=null)?String(queryResult.prevPPExamDuration):"";
			tablePrevPPExamValuesArray["Exam Score"] = prevPPExamScore;
			tablePrevPPExamValuesArray["NCEES Candidate ID Number"] = (queryResult.prevCandidateIDNumber!=null)?String(queryResult.prevCandidateIDNumber):"";
			
		addASITValueToRecord("PREVIOUS P&P", tablePrevPPExamValuesArray, capIDModel);
				 
		var tableReferencesValuesArray = {};
			tableReferencesValuesArray["Name"] = (queryResult.referencesName!=null)?String(queryResult.referencesName):"";
			tableReferencesValuesArray["Address & Telephone #"] = (queryResult.referencesContactInfo!=null)?String(queryResult.referencesContactInfo):"";
			tableReferencesValuesArray["PE"] =(queryResult.referencesType!=null)?String(queryResult.referencesType):"";
			tableReferencesValuesArray["In which state licensed?"] = "";
			tableReferencesValuesArray["License Number"] = "";
			tableReferencesValuesArray["License Issue Date"] = "";
		
		addASITValueToRecord("REFERENCES", tableReferencesValuesArray, capIDModel);	
		
		
	}
	
	if((pcsAppType!=TP_APP_TYPE || queryResult.boardCode!="HO") && (queryResult.boardCode!="PD"))
	{
		var tableSchoolCollegesValuesArray = {};
			tableSchoolCollegesValuesArray["Institution"] = (queryResult.schoolGraduated!=null)?String(queryResult.schoolGraduated):"";
			tableSchoolCollegesValuesArray["City, State"] = (queryResult.schoolLocation!=null)?String(queryResult.schoolLocation):"";
			
			//SIT has separated city and state columns, schoolLocation is 2 character state in the remittance file so making city as space below.			
			tableSchoolCollegesValuesArray["City"] = "";
			tableSchoolCollegesValuesArray["State"] = (queryResult.schoolLocation!=null)?String(queryResult.schoolLocation):"";
			tableSchoolCollegesValuesArray["Graduation Month-year"] = (queryResult.gradYr!=null)?String(queryResult.gradYr):""; // Make as text in config file and DB table
			tableSchoolCollegesValuesArray["Curriculum"] = "";
			tableSchoolCollegesValuesArray["Degree"] = (queryResult.degree!=null)?String(queryResult.degree):"";
			tableSchoolCollegesValuesArray["Earned Credits"] = "";
 
		addASITValueToRecord("SCHOOLS/COLLEGES ATTENDED", tableSchoolCollegesValuesArray, capIDModel);
		
	}

	switch (String(queryResult.boardCode))
	{
		case "PD":
			//updateASITValuesOnPDRecords(queryResult,capIDModel,pcsAppType);
			if(pcsAppType==PD_APP_TYPE || pcsAppType==LL_APP_TYPE)
			{
				ELPLogging.debug("Exam Tab ASIT Fields not Configured, need to uncomment once it is Configured..,its there in Config Design Document");
				var tableEducationValuesArray = {};
				
				tableEducationValuesArray["College/University"] = (queryResult.schoolGraduated!=null)?String(queryResult.schoolGraduated):"";
				tableEducationValuesArray["Degree Type"] =""; 
				tableEducationValuesArray["Location"] = (queryResult.schoolLocation!=null)?String(queryResult.schoolLocation):"";
				tableEducationValuesArray["Major"] ="";
				tableEducationValuesArray["Degree"] = (queryResult.degree!=null)?String(queryResult.degree):"";
				//tableEducationValuesArray["Date of Graduation"] = (queryResult.gradYr!=null)?String(queryResult.gradYr):"";
				ELPLogging.debug("Updating EDUCATION ASIT for record ID = "+capIDModel);
				addASITValueToRecord("EDUCATION", tableEducationValuesArray, capIDModel);	
			}
			break;
	}
	
	//ETI,SIT,PE,PLS,TEMP PERMIT
	var tableLicInOtherJuriValuesArray = {};
		tableLicInOtherJuriValuesArray["License Type"] = (queryResult.otherLicenseType!=null)?String(queryResult.otherLicenseType):"";
		tableLicInOtherJuriValuesArray["License Number"] = (queryResult.otherLicenseNumber!=null)?String(queryResult.otherLicenseNumber):"";
		tableLicInOtherJuriValuesArray["License Jurisdiction"] = (queryResult.otherLicenseJurisdiction!=null)?String(queryResult.otherLicenseJurisdiction):"";
		tableLicInOtherJuriValuesArray["Issue Date"] = (queryResult.otherLicenseIssueDt!=null && queryResult.otherLicenseIssueDt.length!=0)?jsDateToMMDDYYYY(queryResult.otherLicenseIssueDt):"";
		tableLicInOtherJuriValuesArray["Status"] = (queryResult.otherLicenseStatus!=null)?String(queryResult.otherLicenseStatus):"";
		
	addASITValueToRecord("LICENSE IN OTHER JURISDICTIONS", tableLicInOtherJuriValuesArray, capIDModel);
		
}

/** 
 * @desc This method creates the DB connection and execute the supplemental stored procedure
 * @param {emseInsertParameters} emseInsertParameters - Input parameters
 * @param {supplementalTag} supplementalTag - Stored procedure name. 
 */
function callToStoredProcedure(emseInsertParameters, supplementalTag)
{
    for (var stgObjIterator = 0; stgObjIterator < stagingConfigObj.supplemental.length; stgObjIterator ++ )
    {
        var supplementalConfiguration = stagingConfigObj.supplemental[stgObjIterator];

        if (supplementalConfiguration.tag == supplementalTag)
        {
            var record = new StoredProcedure(supplementalConfiguration.procedure, dbConn);
            break;
        }
    }

    if (record == null)
    {
        var message = "Cannot find procedure";
        var exception = new Error(message);
        throw exception;
    }
    
    var staticParameters ={};
    var dynamicParameters ={};
    var batchApplicationResult ={};
    
    record.spCall = "{ CALL " + record.procedure.name + " ";
    
    // add the parameter place holders
    // there is always an out parameter first for the update count
    if ((record.procedure.parameters != null) && 
         record.procedure.parameters.list.length > 0)
    {
        var placeHolders = "";

        var parameters = record.procedure.parameters.list;

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
    
    record.spCall += placeHolders;
    }
    else
    {
        var placeHolders = "";
        placeHolders =  placeHolders + "(?";     // count out parameter
        placeHolders += ") ";
        record.spCall += placeHolders;                
    }

    record.spCall += "}";
	
	ELPLogging.debug("record.spCall -- " + record.spCall);
    record.statement = record.dbConnection.prepareCall(record.spCall);

    var inputParameters = record.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
    record.copyEMSEParameters(emseInsertParameters, inputParameters);

    record.setParameters(inputParameters);
    var queryResult = record.executeProcedure();

    record.close();
	
	return queryResult;
}


/** 
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name 
 * @throws  N/A
 */ 
function getScriptText(vScriptName)
{ 
	var servProvCode = aa.getServiceProviderCode(); 
	if (arguments.length > 1) 
		servProvCode = arguments[1]; 
	vScriptName = vScriptName.toUpperCase(); 
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); 
	try 
	{ 
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN"); 
		return emseScript.getScriptText() + ""; 
	} 
	catch(err) 
	{ 
		return ""; 
	}
}

/**
 * @desc This method is created to send the error report via email.
 * @param {dbConnection} DB connection object.
 * @param {procedureConfiguration} Procedure configuration.
 * @param {runDate} Batch Run Date.
 * @return N/A
 */
// #Defect 10095 4th variable
function emailErrorReport(dbConnection, procedureConfiguration, runDate,bCode) 
{
	ELPLogging.debug("Triggering error report");
	for (var ii = 0; ii < procedureConfiguration.supplemental.length; ii++) {
		var supplementalConfiguration = procedureConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "errorQuery") {
			var errorReportProcedure = new StoredProcedure(supplementalConfiguration.procedure, dbConnection); 
			break;
		}
		}

	if (errorReportProcedure == null ) {
		var message = "Cannot find supplemental stored procedure for Error Query.";
	    returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
	    ELPLogging.error(returnException.toString());
	    return;		
	}	
	try {
	 	ELPLogging.debug("*** Start getErrorReportRecords() ***");
	 	// POC
		// var parameters = {};
		// parameters.runDate = runDate;
		// parameters.batchInterfaceName = "ELP.PCS.DPL.INTAKE";
		// errorReportProcedure.prepareStatement();
		// var inputParameters = errorReportProcedure.prepareParameters(null,null,parameters);
		// ELPLogging.debug("InputParameters for errorReportProcedure: ", inputParameters);
		// errorReportProcedure.setParameters(inputParameters);
		// var dataSet = errorReportProcedure.queryProcedure();

		// POC
		var parameters = {
            "runDate": runDate,
            "batchInterfaceName": "ELP.PCS.DPL.INTAKE",
            "tableName": "ELP_VW_PSI_ERROR"
        };
        var dataSet = getErrorReportRecords(parameters);

		ELPLogging.debug("*** Finished getLicenseConfigurationRecords() ***");
		// loop through all license configuration records
		var licenseConfiguration = null;
		var emailBodyEN = [];
		var emailBodyPY = [];
		var emailBodyHO = [];
		var emailBodyEM = [];
		var emailBodyCH = [];
		var emailBodyAH = [];
		var emailBodyOP = [];
		var emailBodySA = [];
		
		var boardCode = null;
		var firstLine = "The following are input errors in the PCS Intake File that prevented processing of that application.";
		emailBodyEN.push(firstLine);
		emailBodyPY.push(firstLine);		
		emailBodyHO.push(firstLine);

		emailBodyEM.push(firstLine);
		emailBodyCH.push(firstLine);
		emailBodyAH.push(firstLine);
		emailBodyOP.push(firstLine);
		emailBodySA.push(firstLine);
		
		var emailAddressCodeEN = "PCS ERRORS-EN";
		var emailAddressCodePY = "PCS ERRORS-PY";
		var emailAddressCodeHO = "PCS ERRORS-HO";
		
		var emailAddressCodeEM = "PCS ERRORS-EM";
		var emailAddressCodeCH = "PCS ERRORS-CH";
		var emailAddressCodeAH = "PCS ERRORS-AH";
		var emailAddressCodeOP = "PCS ERRORS-OP";
		var emailAddressCodeSA = "PCS ERRORS-SA";
		
		
		var flagEN = false;
		var flagPY = false;
		var flagHO = false;
		
		var flagEM = false;
		var flagCH = false;
		var flagAH = false;
		var flagOP = false;
		var flagSA = false;
		
		ELPLogging.debug("runDate  : " + runDate);
		
		while ((errorData = dataSet.next()) != null)
		{
			var processingDateS = errorData.runDate.toDateString();			
			
			var errorLine = errorData.errorDescription;
			
			var scanner = new Scanner(errorLine, ":");
			
			var boardCode = scanner.next();
			var errorMessage = scanner.next();

			ELPLogging.debug ( " Board : " +bCode + " errorMessage : " +errorMessage );
			
			var errorLine = errorData.batchInterfaceName + ":" + processingDateS + ":" + errorData.recordID + ":	" + errorMessage;
			
			if (bCode == "EN")
			{
				emailBodyEN.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagEN = true;
			}
			else if(bCode == "PY")
			{
				emailBodyPY.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagPY = true;
			}
			else if(bCode == "HO")
			{
				emailBodyHO.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagHO = true;
			}
			else if(bCode == "EM")
			{
				emailBodyEM.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagEM = true;
			}
			else if(bCode == "CH")
			{
				emailBodyCH.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagCH = true;
			}
			else if(bCode == "AH")
			{
				emailBodyAH.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagAH = true;
			}
			else if(bCode == "OP")
			{
				emailBodyOP.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagOP = true;
			}
			else if(bCode == "SA")
			{
				emailBodySA.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagSA = true;
			}
			
			ELPLogging.debug("errorLine : "+errorLine);
		}
			
		if(flagEN)
		{
			ELPLogging.debug("Sending batch status email EM");
			sendBatchStatusEmail(emailAddressCodeEN, "Batch PCS File Errors", emailBodyEN);
		}
		
		if(flagPY)
		{
			ELPLogging.debug("Sending batch status email PY");
			sendBatchStatusEmail(emailAddressCodePY, "Batch PCS File Errors", emailBodyPY);
		}

		if(flagHO)
		{
			ELPLogging.debug("Sending batch status email HO");
			sendBatchStatusEmail(emailAddressCodeHO, "Batch PCS File Errors", emailBodyHO);
		}
		if(flagEM)
		{
			ELPLogging.debug("Sending batch status email EM");
			sendBatchStatusEmail(emailAddressCodeEM, "Batch PCS File Errors", emailBodyEM);
		}	
		if(flagCH)
		{
			ELPLogging.debug("Sending batch status email CH");
			sendBatchStatusEmail(emailAddressCodeCH, "Batch PCS File Errors", emailBodyCH);
		}	
		if(flagAH)
		{
			ELPLogging.debug("Sending batch status email AH");
			sendBatchStatusEmail(emailAddressCodeAH, "Batch PCS File Errors", emailBodyAH);
		}
		if(flagOP)
		{
			ELPLogging.debug("Sending batch status email OP");
			sendBatchStatusEmail(emailAddressCodeOP, "Batch PCS File Errors", emailBodyOP);
		}
		if(flagSA)
		{
			ELPLogging.debug("Sending batch status email SA");
			sendBatchStatusEmail(emailAddressCodeSA, "Batch PCS File Errors", emailBodySA);
		}
	}
	catch (ex) {
		ELPLogging.error("Send Error Email Error : ", ex);
	} finally {
		if (dataSet != null) {
			dataSet.close();
		}
		if (errorReportProcedure != null) {
			errorReportProcedure.close();
		}
	}
	
	ELPLogging.debug("emailErrorReport End.");
}

/** 
 * @desc This Method validates Application record for all boards.
 * @param queryResult : Contains dataSet of PCS Staging table.
 * @throws N/A.
 */
function applicationRecordValidation(queryResult)
{
	var validationResult = {};
	
	// Validate the SSN number.
	validationResult.ssnFlag = validateSSN(queryResult.socSecNumber);
	validationResult.applicationRecordFlag = false;
	
	if (validationResult.ssnFlag.ssnFlag)
	{
		ELPLogging.debug("SSN Number validated");				
		if (queryResult.primaryPhone != null && queryResult.primaryPhone.length != 0)
		{
			validationResult.phoneNumberFlag = validatePhoneNumber(queryResult.primaryPhone);
			validationResult.applicationRecordFlag = true;
			if (validationResult.phoneNumberFlag)
			{
				ELPLogging.debug("Phone number validation successful.");
			}
		}
		else
		{
			validationResult.applicationRecordFlag = true;
		}
	}
	else
	{
		ELPLogging.debug("Invalid SSN number");
		var recordID;
		var errorMessage = "SSN validation Failed";
		if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
		{
			recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
		}
		else if((queryResult.firstName != null) && (queryResult.lastName != null))
		{
			recordID = queryResult.firstName+ " " +queryResult.lastName;
		}
		var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};	  
		callToStoredProcedure(emseInsertParameters, "errorTableInsert");
		
		var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : errorMessage, "intakeStatus": "PROCESSED_EMSE_ERROR"};

		updateStgRecord(emseUpdateParameters); 
		
	}
	return validationResult;
}

/** 
 * @desc The Method validates exam data available on License record or not.
 * @param queryResult : Contains dataSet of PCS Staging table.
 * @returns {Boolean} validation flag
 * @throws  N/A
 */ 
function validateExamDataAvilableInLicenseRecord(queryResult)
{
	ELPLogging.debug("Checking if exam details available on License Record");
	var validationResult = false;
	
	// These are the required field to create an exam entry in application record.
	if (queryResult.examDate != null)
	{
		validationResult = true;
		ELPLogging.debug("Exam details available on License Record");
	}
	else
	{
		ELPLogging.debug("Exam details not available on License Record");
	}
	
	return validationResult;
}

/**
 * @desc This method create the Temp permit to an applicant.
 * @param {queryResult} - Contains dataSet of PCS Staging table.
 */
function createTempPermitRecord(queryResult)
{
	ELPLogging.debug("Processing Temp Permit Record ");
	//Create Application record.
	var capID = processApplicationRecord(queryResult);
	if (capID)
	{ 													
		//Call the method to get Application record details.
		var applicationTypeInfo = licenseData.getApplicationType(capID);
		ELPLogging.debug("Processing Cap Type Alias : " + licenseData.capTypeAlias);
		var lastSequenceNbr = null;
		var licenseNumberValidationResult = false;
		var expDateValidationResult = false;
		var varLicParams = {"BOARD_CODE":queryResult.boardCode,"TYPE_CLASS":(queryResult.typeClass).trim(),"LICENSE_NUMBER":queryResult.licenseNumber,"LIC_EXP_DATE":new Date(0),"ISSUE_DATE":queryResult.licIssueDate};
		
		//Fetch the license sequence number from the standard choice LICENSE_SEQUENCE_NUMBER and after processing it update the value with incremented license sequence number.
		lastSequenceNbr = getSharedDropDownDescriptionDetails(licenseData.capTypeAlias, "LICENSE_SEQUENCE_NUMBER");
		lastSequenceNbr=parseInt(lastSequenceNbr)+1;
		ELPLogging.debug("Fetched license sequence number as : " + lastSequenceNbr+ " for record type : "+licenseData.capTypeAlias);
		
		
		//Calculate the exp date range
		// a.	The expiration date will be calculated based on the ASI with the field name as "what day do you wish your 30 day to start?" This expiration date will be 30 days after the temp permit date has been selected.
		//	The expiration date field will be blank if the ASI field is not populated
		
		ELPLogging.debug("Temp permit start date : "+queryResult.tempPermitStartDate);
		var dayToStartTempPermit = queryResult.tempPermitStartDate;
		var expDate = null;
		if(dayToStartTempPermit)
		{
			//Calculate the expire date, This expiration date will be 30 days after the temp permit date has been selected.
			ELPLogging.debug("dayToStartTempPermit = "+dayToStartTempPermit.getDate());

			dayToStartTempPermit.setDate(dayToStartTempPermit.getDate() + 30);
			
			ELPLogging.debug("Days to start Temp Permit: "+dayToStartTempPermit);
			//Setting license expiry date
			varLicParams.LIC_EXP_DATE = dayToStartTempPermit;
		}
		else if(queryResult.licExpirDate!=null)
		{
			ELPLogging.debug("Expiration date sent in the file for Temp Permit: "+queryResult.licExpirDate);
			varLicParams.LIC_EXP_DATE = queryResult.licExpirDate;
		}
		else
		{
			ELPLogging.debug("No Expiration date No ASI to start temp permit");
			var tempissueDate  = queryResult.licIssueDate;
			tempissueDate.setDate(tempissueDate.getDate() + 30);
			varLicParams.LIC_EXP_DATE  = tempissueDate;
			var newIssueDate = new Date(tempissueDate);
            newIssueDate.setDate(tempissueDate.getDate() - 30);
            varLicParams.ISSUE_DATE = newIssueDate;
			queryResult.licIssueDate=newIssueDate;
			//tempDate.setDate(tempDate.getDate()-30);
		}
		
		
		if(licenseData.checkLicenseNumber(capID, varLicParams))
		{
			// create Transaction, Reference License records 
			// and update the work-flow task/status for Application record.
			var newLicNumber = licenseData.issueLicense(capID, varLicParams);	
			// Update the License sequence number for License records where PCS License number and
			// License sequence number in standard choice are same.
			ELPLogging.debug("Updating the License sequence number:  "+newLicNumber);
			updateStandardChoice("LICENSE_SEQUENCE_NUMBER",licenseData.capTypeAlias,lastSequenceNbr);		
			
			if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
			{
				updateExamVendorCashInfo(capID);
			}
			
			if(!contactAddressDetailsArray.validAddress) 
			{
				var addressconditionComment = "adressline1: " + queryResult.addrs1stLn + ", addressLine2:" + queryResult.addrs2ndLn + ", city : " + queryResult.cityTwn + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
				addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,newLicNumber,CONDITION_TYPE,addressconditionComment); 
				ELPLogging.debug("Condition created");				
			}

			//addASITValueToRecord("LICENSE INFORMATION", tableValuesArray, newLicNumber);
			
			// Update parameters to update the staging table for processed records.
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
			updateStgRecord(updateParameters);
		}
		else
		{
			// delete record from PCS staging table.	    			
			var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Permit already exists # " + licenseData.formatLicense(capID, varLicParams), "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.firstName + " " + queryResult.lastName, "boardCode":queryResult.boardCode, "runDate" :runDate};		
			updateStgRecord(emseUpdateParameters);
		}
		ELPLogging.debug("Finished Processing Temp Permit Record");
	}
	else
	{
		// For Invalid Application number add error entry into error table and
		// delete record from PCS staging table.
		var errorDescription = "Unable to create Application record for " + queryResult.firstName + " " + queryResult.lastName;
		var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : errorDescription}
		updateStgRecord(updateParameters);
	}
	
	return capID;
}
/** 
 * @desc The purpose of this method is to upgrade the license workflow task to "Upgraded", if EIT/SIT certificate present in PE/PLS type class record.
 * @param {certificateNumber} certificateNumber - contains the certificate number.
 * @throws  N/A
 */
function upgradeEITSITCertificate(certificateNumber)
{
	ELPLogging.debug("Processing Certificate# " + certificateNumber)
	var capId = "";
	var capListResult = aa.cap.getCapID(certificateNumber); 
	if (capListResult.getSuccess())
	{ 						
		capId = capListResult.getOutput();			
		if(capId)
		{
			updateTaskStatus("License", "Upgraded", "","","", capId);
			ELPLogging.debug("Finished updating the license status to Upgraded for capID: "+capId);
		}
		else
		{
			ELPLogging.debug("No record associated to the certificate number :"+certificateNumber);
		}
	}
	else
	{
		ELPLogging.debug("Error : "+capListResult.getErrorMessage());
	}	
}

/** 
 * @desc The purpose of this method is to expire the license status based on temp permit number.
 * @param {tempPermitNumber} tempPermitNumber - contains the temp permit number.
 * @throws  N/A
 */
function expireTempPermit(tempPermitNumber)
{
	ELPLogging.debug("Processing Temp Permit " + tempPermitNumber)
	var expiredPermitFlag = false;
	var capID = "";
	tempPermitNumber = tempPermitNumber.trim();
	var capListResult = aa.cap.getCapID(tempPermitNumber); 
	if (capListResult.getSuccess())
	{ 						
		capId = capListResult.getOutput();			
		if(capId)
		{
			updateTaskStatus("License", "Expired", "","","", capId);
			//Set the temp permit date to current date.
			licenseData.setLicExpirationDate(capId, new Date());
			expiredPermitFlag = true;
			ELPLogging.debug("Finished updating the license status to Expired for capID: "+capId);
		}
		else
		{
			ELPLogging.debug("No record associated to the temp permit number :"+tempPermitNumber);
		}
	}
	else
	{
		ELPLogging.debug("Error : "+capListResult.getErrorMessage());
	}	
	return expiredPermitFlag;
}

/** 
 * @desc This method performs the address validation
 * @param {queryResult} queryResult - row set of an result Set.
 */

function performAddressValidation(queryResult)
{
	ELPLogging.debug("Performing Address validation for row number : " +queryResult.rowNumber);
	
	// Validates the Address.
	var contactAddressDetailsArray = new Array();
	var contactAddressDetailsArrayTMP = new Array();
	var zipCode = null;
	var addressLine1 = '';
	
	if(queryResult.zipCodeB != null)
	{
		zipCode = queryResult.zipCodeA+"-"+queryResult.zipCodeB;
	}
	else
	{
		zipCode = queryResult.zipCodeA;
	}
	

	
	// Defect 7468 - Start
	if (queryResult.buildingNum != null)
	{
		addressLine1 = queryResult.buildingNum + " " + queryResult.addrs1stLn;
	}
	else
	{
		addressLine1 = queryResult.addrs1stLn;
	}
	
	var recordID;
	if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
	{
		recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
	}
	else if((queryResult.firstName != null) && (queryResult.lastName != null))
	{
		recordID = queryResult.firstName+ " " +queryResult.lastName;
	}
	
	var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PCS ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
	if(isEnabledAddressValidation.toLowerCase()=="true")
	{
		ELPLogging.debug("Start validating contact address");
		contactAddressDetailsArrayTMP = validateAddress(addressLine1, queryResult.addrs2ndLn, queryResult.cityTwn, queryResult.state, zipCode, queryResult.buildingNum, "USA", "DPL", "BATCHJOB"); 
		if(!contactAddressDetailsArrayTMP)
		{
			//Contact Address Validation Failed
			//Skipping Address Validation!
			/*var errorMessage = "PCS Address validation failed for Contact Address:"+queryResult.boardCode;
			var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : runDate};
			callToStoredProcedure(emseInsertParameters, "errorTableInsert");*/
			ELPLogging.debug("Invalid Address---");
			contactAddressDetailsArray["addressLine1"] = addressLine1;
			contactAddressDetailsArray["addressLine2"] = queryResult.addrs2ndLn;
			contactAddressDetailsArray["city"] = queryResult.cityTwn;
			contactAddressDetailsArray["state"] = queryResult.state;
			contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeA
			contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeB;
			contactAddressDetailsArray.validAddress = false;
			
		}
		else
		{
			contactAddressDetailsArray = contactAddressDetailsArrayTMP;
			contactAddressDetailsArray.validAddress = true;
		}
		
	}
	else
	{
		//Skipping Address Validation!
		ELPLogging.debug("Skipped Address validation for Applicant address");
		contactAddressDetailsArray["addressLine1"] = addressLine1;
			contactAddressDetailsArray["addressLine2"] = queryResult.addrs2ndLn;
			contactAddressDetailsArray["city"] = queryResult.cityTwn;
			contactAddressDetailsArray["state"] = queryResult.state;
			contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeA
			contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeB;
			contactAddressDetailsArray.validAddress = true;			
	}
	
	// Defect 10060
	if(queryResult.boardCode=="EM")
	{
		if (queryResult.typeClass == "6")
		{
			contactAddressDetailsArray["bBuildingNumber"]=(queryResult.bBuildingNumber!=null)?String(queryResult.bBuildingNumber):"";
			contactAddressDetailsArray["bAddrLn1"]=(queryResult.bAddrLn1!=null)?String(queryResult.bAddrLn1):addressLine1;
			contactAddressDetailsArray["bAddrLn2"]=(queryResult.bAddrLn2!=null)?String(queryResult.bAddrLn2):queryResult.addrs2ndLn;
			contactAddressDetailsArray["bCityTwn"]=(queryResult.bCityTwn!=null)?String(queryResult.bCityTwn):queryResult.cityTwn;
			contactAddressDetailsArray["bState"]=(queryResult.bState!=null)?String(queryResult.bState):queryResult.state;
			contactAddressDetailsArray["bZipA"]=(queryResult.bZipA!=null)?String(queryResult.bZipA):queryResult.zipCodeA;
			contactAddressDetailsArray["bZipB"]=(queryResult.bZipB!=null)?String(queryResult.bZipB):queryResult.zipCodeB;
		}
		else
		{
			contactAddressDetailsArray["bBuildingNumber"]=(queryResult.bBuildingNumber!=null)?String(queryResult.bBuildingNumber):"";
			contactAddressDetailsArray["bAddrLn1"]=(queryResult.bAddrLn1!=null)?String(queryResult.bAddrLn1):"";
			contactAddressDetailsArray["bAddrLn2"]=(queryResult.bAddrLn2!=null)?String(queryResult.bAddrLn2):"";
			contactAddressDetailsArray["bCityTwn"]=(queryResult.bCityTwn!=null)?String(queryResult.bCityTwn):"";
			contactAddressDetailsArray["bState"]=(queryResult.bState!=null)?String(queryResult.bState):"";
			contactAddressDetailsArray["bZipA"]=(queryResult.bZipA!=null)?String(queryResult.bZipA):"";
			contactAddressDetailsArray["bZipB"]=(queryResult.bZipB!=null)?String(queryResult.bZipB):"";
		}
	}
	
	// Defect 7468 - End
	if (contactAddressDetailsArray.validAddress)
	{
		ELPLogging.debug("Tested Address");
		return contactAddressDetailsArray;
	}
	else
	{
		ELPLogging.debug("Invalid Address");
		return contactAddressDetailsArray;
	
	}
}
/**
 * @desc This method creates a cap contact for the record.
 * @param {capIdModel} capIDModel - contains the record ID from Accela system.
 * @param {queryResult} contains query result from staging table.
 * @param {contactAddressDetailsArray} contains contact address details array.
 * @throws ELPAccelaEMSEException
 */
function createCapContactForRecord(capIDModel, queryResult, contactAddressDetailsArray)
 {
	ELPLogging.debug("Creating cap contact for record ID : " +capIDModel);
	
	var capContactModel = new com.accela.aa.aamain.people.CapContactModel(); 
	var peopleScriptModelResult = aa.people.createPeopleModel();
	var peopleScriptModel = peopleScriptModelResult.getOutput();
	
	if (peopleScriptModel)
	{
		//create PeopleModel and populate
		var peopleModel = peopleScriptModel.getPeopleModel();
        peopleModel.setContactType("Applicant");	
        peopleModel.setFlag("Y");
        peopleModel.setFirstName(queryResult.firstName);
        peopleModel.setLastName(queryResult.lastName);
		ELPLogging.debug("Middle Name from intake file : " + queryResult.middleName);
		var middleName;
		if(queryResult.middleName == null) {
			ELPLogging.debug("Middle Name found null from intake file : ");
			middleName = "";
		}
		else {
			ELPLogging.debug("Middle Name is valid from intake file : ");
			middleName = queryResult.middleName;
		}
		peopleModel.setMiddleName(middleName);
		/* Fix for defect #5350 */
		var ssn = formatSSN(queryResult.socSecNumber);
		peopleModel.setSocialSecurityNumber(ssn);
		peopleModel.setServiceProviderCode("DPL");
        peopleModel.setPhone1(queryResult.primaryPhone);
		
        peopleModel.setEmail(queryResult.emailID);
        peopleModel.setAuditStatus("A");
        peopleModel.setStartDate(new java.util.Date());
        peopleModel.setAuditID("BATCHUSER");
		peopleModel.setGender(queryResult.gender);
		peopleModel.setBirthDate(queryResult.dateOfBirth);
		
		if ((queryResult.prefCommunication != null && queryResult.prefCommunication.length !=0) && (queryResult.prefCommunication.toUpperCase() == "EMAIL"))
		{
			// Setting the preferred communication mode to Email.
			peopleModel.setPreferredChannel(1);
		}
		else
		{
			// Setting the preferred communication mode to Mail.
			peopleModel.setPreferredChannel(0);
		}
		capContactModel.setPeople(peopleModel);
		capContactModel.setNamesuffix(queryResult.generation);
        capContactModel.setCapID(capIDModel); 	
		
		//Discipline History Template
		var templateModel = aa.genericTemplate.getTemplateStructureByGroupName("CT-IND-DIS").getOutput();
		capContactModel.setTemplate(templateModel);
		
		/************ Setting contact ASI on application ***************/
		var peopleTemplate = capContactModel.getTemplate();
		var templateGroups = peopleTemplate.getTemplateForms();
		var subGroups = templateGroups.get(0).getSubgroups();
		
		for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++)
		{
			var subGroup = subGroups.get(subGroupIndex);
			var subGrpName = subGroup.getSubgroupName();
			var asiFields = subGroup.getFields();
			
			for (var fieldIndex = 0; fieldIndex< asiFields.size();fieldIndex++)
			{
				var field = asiFields.get(fieldIndex);
				
				if(field.getFieldName()=="1. Has disciplinary action been taken against you by a licensing board in any jurisdiction?")
				{
					field.setDefaultValue(queryResult.discActionTaken);
				}
				if(field.getFieldName()=="2. Are you the subject of pending disciplinary action by a licensing board in any jurisdiction?")
				{
					field.setDefaultValue(queryResult.pendingDiscAction);
				}
				if(field.getFieldName()=="3. Have you voluntarily surrendered a professional license to a licensing board in any jurisdiction?")
				{
					field.setDefaultValue(queryResult.voluntarilySurrendered);
				}
				if(field.getFieldName()=="4. Have you ever applied for and been denied a professional license in any jurisdiction?")
				{
					field.setDefaultValue(queryResult.appliedOrDeniedProfLic);
				}
				if(field.getFieldName()=="5. Have you been convicted of a felony or misdemeanor in any jurisdiction?")
				{
					field.setDefaultValue(queryResult.juriConvicted);
				}
			}
		}
		
		/************ Setting contact ASI on application - end ***************/
		
		//Creating cap contact
		var createContactResult = aa.people.createCapContact(capContactModel);
		if(!createContactResult.getSuccess())
		{
			var returnException = new ELPAccelaEMSEException("Error creating the Complainant for record "+capIDModel+": "+createContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
		}
				
		var contactSeqNumber = getContactSeqNumber(capIDModel);
		ELPLogging.debug("Contact sequence number = " +contactSeqNumber);
		
		//create the contact address
		createContactAddress(capIDModel, contactSeqNumber, contactAddressDetailsArray);
		ELPLogging.debug("Successfully created contact address for record ID : " +capIDModel);
		
		ELPLogging.debug("*********  Creating reference contact from transaction contact starts  *********");
		
		//Creating reference contacts from cap contact and link it to the record
		var refSeqNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel, null, null, false, false, peopleDuplicateCheck);
		ELPLogging.debug("refSeqNumber : " +refSeqNumber);	
		setContactsSyncFlag("N");
		
	}
	else
	{
		var returnException = new ELPAccelaEMSEException("Error creating a people model for "+capIDModel+": "+peopleScriptModelResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}


/**
 * @desc This method creates a current employer contact for the record.
 * @param {capIdModel} capIDModel - contains the record ID from Accela system.
 * @param {queryResult} contains query result from staging table.
 * @throws ELPAccelaEMSEException
 */
function createCurrentEmpContactForRecord(capIDModel, queryResult)
 {
	ELPLogging.debug("Creating current employer contact for record ID : " +capIDModel);
	
	var capContactModel = new com.accela.aa.aamain.people.CapContactModel(); 
	var peopleScriptModelResult = aa.people.createPeopleModel();
	var peopleScriptModel = peopleScriptModelResult.getOutput();
	var zipCode=null;
	var currentEmpContactAddressDetailsArray = new Array();
	if (peopleScriptModel)
	{
		//create PeopleModel and populate
		var peopleModel = peopleScriptModel.getPeopleModel();
        peopleModel.setContactType("Current Employer");	
		peopleModel.setBusinessName(queryResult.presEmpCompName);
		peopleModel.setAuditStatus("A");
        peopleModel.setStartDate(new java.util.Date());
		capContactModel.setPeople(peopleModel);
        capContactModel.setCapID(capIDModel);
		
		//Creating cap contact
		var createContactResult = aa.people.createCapContact(capContactModel);
		if(!createContactResult.getSuccess())
		{
			var returnException = new ELPAccelaEMSEException("Error creating the Complainant for record "+capIDModel+": "+createContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
		}
				
		var contactSeqNumber = getCurrentEmpContactSeqNumber(capIDModel);
		ELPLogging.debug("Current Employer Contact sequence number = " +contactSeqNumber);
	
		//Validate current employer contact address for EN: PE & LS type class record.
		if(queryResult.presEmpZipCodeB != null)
		{
			zipCode = queryResult.presEmpZipCodeA+"-"+queryResult.presEmpZipCodeB;
		}
		else
		{
			zipCode = queryResult.presEmpZipCodeA;
		}

		//validating the current employer address
		var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PCS ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
		if(isEnabledAddressValidation.toLowerCase()=='true')
		{
			ELPLogging.debug("Start validating current employer address");
			currentEmpContactAddressDetailsArray = validateAddress(queryResult.presEmpAddrLn1, queryResult.presEmpAddrLn2, queryResult.presEmpCity, queryResult.presEmpState, zipCode, null, "USA", "DPL", "BATCHJOB");
		}
		else
		{
			ELPLogging.debug("Skipped Address validation for current employer address");
			currentEmpContactAddressDetailsArray.addressLine1 = queryResult.presEmpAddrLn1;
			currentEmpContactAddressDetailsArray.addressLine2 = queryResult.presEmpAddrLn2;
			currentEmpContactAddressDetailsArray.city = queryResult.presEmpCity;
			currentEmpContactAddressDetailsArray.state = queryResult.presEmpState;
			currentEmpContactAddressDetailsArray.zipCodeB = queryResult.presEmpZipCodeB;
			currentEmpContactAddressDetailsArray.zipCodeA = queryResult.presEmpZipCodeA;
		}
		
		if(currentEmpContactAddressDetailsArray)
		{
			//create the contact address
			createContactAddress(capIDModel, contactSeqNumber, currentEmpContactAddressDetailsArray);
			ELPLogging.debug("Successfully created contact address for record ID : " +capIDModel);
			
			ELPLogging.debug("*********  Creating reference contact from transaction contact starts  *********");
			
			//Creating reference contacts from cap contact and link it to the record
			var refSeqNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel, null, null, false, false, peopleDuplicateCheck);
			ELPLogging.debug("refSeqNumber : " +refSeqNumber);	
		}
		else
		{
			ELPLogging.debug("Invalid Current Employer address for Record #: " +capIDModel);	
			// For record, Application record validation fails:
			// 1. Add error entry into error table.
			// 2. Delete record from PCS staging table.	      	    		
			var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Application record validation failed for current employer address.", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.firstName + " " + queryResult.lastName, "runDate" :runDate, "boardCode":queryResult.boardCode};
			updateStgRecord(emseUpdateParameters); 		
		}
		
	}
	else
	{
		var returnException = new ELPAccelaEMSEException("Error creating a people model for "+capIDModel+": "+peopleScriptModelResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc This method creates contact address for the record.
 * @param {capIDModel} - contains the record ID.
 * @param {contactSeqNumber} - contains the contact sequence number for the contact the Address will be added to.
 * @param {contactAddressDetailsArray} contains contact Address Details Array from staging table.
 * @throws ELPAccelaEMSEException
 */
function createContactAddress(capIDModel, contactSeqNumber, contactAddressDetailsArray)
{
	ELPLogging.debug("Create contact address for contact sequence number : " +contactSeqNumber);
	    
	//set the address values
	var capContactAddressModel = new com.accela.orm.model.address.ContactAddressModel();
	
	capContactAddressModel.setAddressLine1(contactAddressDetailsArray.addressLine1);
	capContactAddressModel.setAddressLine2(contactAddressDetailsArray.addressLine2);
    capContactAddressModel.setCity(contactAddressDetailsArray.city);
    capContactAddressModel.setState(contactAddressDetailsArray.state);
	
    
	var zipCode=null;
	if(contactAddressDetailsArray.zipCodeB != null)
	{
		zipCode = contactAddressDetailsArray.zipCodeA+"-"+contactAddressDetailsArray.zipCodeB;
	}
	else
	{
		zipCode = contactAddressDetailsArray.zipCodeA;
	}
	capContactAddressModel.setZip(zipCode);
    
    capContactAddressModel.setCountryCode("US");		
    capContactAddressModel.setEntityType("CAP_CONTACT");	
    capContactAddressModel.setAddressType("Mailing Address");
    capContactAddressModel.setEntityID(contactSeqNumber);
    
	var createContactAddressResult = aa.address.createCapContactAddress(capIDModel,capContactAddressModel);

	if(!createContactAddressResult.getSuccess())
	{
		var returnException = new ELPAccelaEMSEException("Error creating the Contact Address for "+capIDModel+": "+createContactAddressResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc This method retrieves the contact sequence number of a contact on the specified CAP record with the specified contact type
 * @param {capIdModel} capIDModel - contains the cap id of the CAP record.
 * @return {string} contactSeqNumber - contains the contact sequence number of the contact.
 * @throws ELPAccelaEMSEException
 */
function getContactSeqNumber(capIDModel)
{
	ELPLogging.debug("Retrieve contact sequence number for record : " +capIDModel);
	var contactSeqNumber;
	//retrieve list of contacts for the record
    var capContactResult = aa.people.getCapContactByCapID(capIDModel);
    var capContactList = capContactResult.getOutput();
    
	if(capContactList)
	{
    	//loop through the list of contacts
        for(index in capContactList)
        {
			//Get contact sequence number
	        contactSeqNumber = capContactList[index].getPeople().getContactSeqNumber();
	        contactSeqNumber = aa.util.parseLong(contactSeqNumber);
	        ELPLogging.debug("contactSeqNumber : " +contactSeqNumber);
			
	        return contactSeqNumber;            
        }
        var returnException = new ELPAccelaEMSEException("Could not locate the contact type for record "+capIDModel, ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException;
    }
    else
    {
    	var returnException = new ELPAccelaEMSEException("Error retrieving the contact list for "+capIDModel+": "+capContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException;
	}
}

/**
 * @desc This method retrieves the contact sequence number of a contact on the specified CAP record with the specified contact type
 * @param {capIdModel} capIDModel - contains the cap id of the CAP record.
 * @return {string} contactSeqNumber - contains the contact sequence number of the contact.
 * @throws ELPAccelaEMSEException
 */
function getCurrentEmpContactSeqNumber(capIDModel)
{
	ELPLogging.debug("Retrieve current employer contact sequence number for record : " +capIDModel);
	
	//retrieve list of contacts for the record
    var capContactResult = aa.people.getCapContactByCapID(capIDModel);
    var capContactList = capContactResult.getOutput();
    
	if(capContactList)
	{
    	//loop through the list of contacts
        for(index in capContactList)
        {
			//Get contact sequence number
			var capContactType = capContactList[index].getPeople().getContactType(); 
			ELPLogging.debug("capContactType associated with the record : " +capContactType);
			if(capContactType == "Current Employer")
			{
				var contactSeqNumber = capContactList[index].getPeople().getContactSeqNumber();
				contactSeqNumber = aa.util.parseLong(contactSeqNumber);
				ELPLogging.debug("current employer contact sequence Number : " +contactSeqNumber);
			
				return contactSeqNumber;            
			}
        }
		ELPLogging.debug("Could not locate the contact type")
        var returnException = new ELPAccelaEMSEException("Could not locate the contact type for record "+capIDModel, ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException; 
    }
    else
    {
		ELPLogging.debug("Error retrieving the contact list for")
    	var returnException = new ELPAccelaEMSEException("Error retrieving the contact list for "+capIDModel+": "+capContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
        throw returnException;
	}
}

/** 
 * @desc This method add standard condition on reference contact. 
 * @param {conditionType} contains condition type
 * @param {conditionDesc} contains condition description
 * @param {capID} contains the record ID
 * @throws N/A
 */ 
function addContactStdConditionOnRefContact(conditionType, conditionDesc, comment, capId) 
{
	ELPLogging.debug("Add condition on reference contact.");
	var addContactConditionResult = null;
	var foundCondition = false;
	var javascriptDate = new Date()
	var javautilDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());
	cStatus = "Applied";

	if (arguments.length > 3)
	cStatus = arguments[3]; // use condition status in args
	
	if (!aa.capCondition.getStandardConditions) 
	{
		ELPLogging.debug("addAddressStdCondition function is not available in this version of Accela Automation.");
	}
	else
	{
		standardConditions = aa.capCondition.getStandardConditions(conditionType, conditionDesc).getOutput();

		for (index = 0; index < standardConditions.length; index++)
		{
		  if (standardConditions[index].getConditionType().toUpperCase() == conditionType.toUpperCase() 
				&& standardConditions[index].getConditionDesc().toUpperCase() == conditionDesc.toUpperCase())
		  {
			standardCondition = standardConditions[index]; // add the last one found
			ELPLogging.debug("cComment = " +standardCondition.getConditionComment());
			foundCondition = true;
			
			  var capContactResult = aa.people.getCapContactByCapID(capId);
			  if (capContactResult.getSuccess()) 
			  {
				var Contacts = capContactResult.getOutput();
				for (var contactIdx in Contacts)
				{
				  refContactNumber = Contacts[contactIdx].getCapContactModel().refContactNumber;
				  
				  var conditionComment = standardCondition.getConditionComment() + " with License# : " + refContactNumber + ", "+ comment;
				  
				  if (refContactNumber)
				  {
					var newCondition = aa.commonCondition.getNewCommonConditionModel().getOutput();
					newCondition.setServiceProviderCode(aa.getServiceProviderCode());
					newCondition.setEntityType("CONTACT");
					newCondition.setEntityID(refContactNumber);
					newCondition.setConditionDescription(standardCondition.getConditionDesc());
					newCondition.setConditionGroup(standardCondition.getConditionGroup());
					newCondition.setConditionType(standardCondition.getConditionType());
					newCondition.setConditionComment(conditionComment);
					newCondition.setImpactCode(standardCondition.getImpactCode());
					newCondition.setConditionStatus(cStatus)
					newCondition.setAuditStatus("A");
					newCondition.setIssuedByUser(systemUserObj);
					newCondition.setIssuedDate(javautilDate);
					newCondition.setEffectDate(javautilDate);
					newCondition.setAuditID(currentUserID);

					var addContactConditionResult = aa.commonCondition.addCommonCondition(newCondition);
					if (addContactConditionResult.getSuccess())
					{
					  ELPLogging.debug("Successfully added reference contact (" + refContactNumber + ") condition: " + conditionDesc);
					}
					else 
					{
					  ELPLogging.debug("**ERROR: adding reference contact (" + refContactNumber + ") condition: " + addContactConditionResult.getErrorMessage());
					}
				  }
				  else
				  {
					ELPLogging.debug("No contact sequence number associated with the record.");
				  }
				}
			  }
		  }
		}
	}
	
	if (!foundCondition)
	{
		ELPLogging.debug("**WARNING: couldn't find standard condition for " + conditionType + " / " + conditionDesc);
	}
  return addContactConditionResult;
}


/** 
 * @desc The purpose of this method is to update the ASIT table value on License record.
 * @param {queryResult} queryResult - contains the row set of result.
 * @param {capIDModel} capIDModel - contains Cap ID.
 * @throws  N/A
 */ 
function updateASITValuesOnLicense(queryResult,capIDModel)
{
	var tableLicInOtherJuriValuesArray = {};
		tableLicInOtherJuriValuesArray["License Type"] = (queryResult.otherLicenseType!=null)?String(queryResult.otherLicenseType):"";
		tableLicInOtherJuriValuesArray["License Number"] = (queryResult.otherLicenseNumber!=null)?String(queryResult.otherLicenseNumber):"";
		tableLicInOtherJuriValuesArray["License Jurisdiction"] = (queryResult.otherLicenseJurisdiction!=null)?String(queryResult.otherLicenseJurisdiction):"";
		tableLicInOtherJuriValuesArray["Issue Date"] = (queryResult.otherLicenseIssueDt!=null && queryResult.otherLicenseIssueDt.length!=0)?jsDateToMMDDYYYY(queryResult.otherLicenseIssueDt):"";
		tableLicInOtherJuriValuesArray["Status"] = (queryResult.otherLicenseStatus!=null)?String(queryResult.otherLicenseStatus):"";
		addASITValueToRecord("LICENSE IN OTHER JURISDICTIONS", tableLicInOtherJuriValuesArray, capIDModel);
}

/** 
 * @desc The purpose of this method is to update the ASI value on License record.
 * @param {queryResult} queryResult - contains the row set of result.
 * @param {capIDModel} capIDModel - contains Cap ID.
 * @throws  N/A
 */ 
function updateASIValuesOnLicense(queryResult,capIDModel,applicationId)
{
	
	var noFeeCollectedObject;
			
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollectedObject = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollectedObject = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollectedObject = "Spouse";
	}
	else
	{
		noFeeCollectedObject = "N/A"
	}
	
	//EIT
	if(EIT_APP_TYPE == getPCSApplicationType(queryResult))
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
	}

	//PE
	if(PE_APP_TYPE == getPCSApplicationType(queryResult))
	{
		
		ELPLogging.debug("Record ID # : " + applicationId);
		var STDCHOICEASI = "PE_QUALIFICATION_FOR_PE_BRANCH";
		var asiValue = getASI("Based on education, experience & exams, which branch/discipline best matches your qualifications?",applicationId);
		ELPLogging.debug("Type Class ASI value is : " + asiValue + " for record # : " + applicationId);
		var typeClass = getSharedDropDownDescription(STDCHOICEASI, asiValue);
		ELPLogging.debug("Type Class achieved for EN board is : " + typeClass);
		
		updateASIValues(capIDModel, "LICENSE TYPE", "Type Class", asiValue);
		updateASIValues(capIDModel, "TYPE CLASS", "Type Class", queryResult.typeClass);
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
	}
	//PLS
	if(PLS_APP_TYPE == getPCSApplicationType(queryResult))
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
		updateASIValues(capIDModel, "LICENSE TYPE", "Board", queryResult.boardCode);
		
	}
	//PY Board
	if(queryResult.boardCode=="PY")
	{
		updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
		//updateASIValues(capIDModel, "DOCTORAL", "University", queryResult.schoolGraduated);
		//updateASIValues(capIDModel, "DOCTORAL", "Dates attended", queryResult.gradYr);
		//updateASIValues(capIDModel, "DOCTORAL", "Doctoral degree", queryResult.degree);
		copyASITable(applicationId, capIDModel, "DOCTORAL");
		copyASITable(applicationId, capIDModel, "RE-SPECIALIZATION PROGRAM");
	}
}

//Fix for CR 213
/** 
 * @desc The purpose of this method is to activate the workflow task on Application record.
 * @param {wfstr} String - contains the task name.
 * @param {capId} capId - contains Cap ID.
 * @throws  N/A
 */ 
function activateTaskByCapID(wfstr,capId) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { 
		ELPLogging.debug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; 
	}

    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();

            if (useProcess)
                aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
            else
                aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

            ELPLogging.debug("Activating Workflow Task: " + wfstr);
        }
    }
}

/** 
 * @desc The purpose of this method is to grab the application type based on type class.
 * @param {queryResult} data set.
 * @return pcsAppType - PCS application type.
 */ 
function getPCSApplicationType(queryResult)
{
	if(queryResult.typeClass != null && queryResult.typeClass.length != 0)
	{
        var pcsAppType;
        if (queryResult.boardCode == 'EN' && queryResult.typeClass == 'CH')
        {
            pcsAppType = 'PE';
        }
        else
        {            
            pcsAppType = getSharedDropDownDescription(PCS_TYPE_CLASSES_STD_CHOICE,(queryResult.typeClass).trim());
        }
		ELPLogging.debug("PCS Application Type: "+ pcsAppType);
		return pcsAppType;	
	}
	else
	{
		ELPLogging.notify("PCS Record missing required fields : PCS Record missing type class");   
		var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PCS Record missing type class." , "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.firstName + " " + queryResult.lastName, "runDate" :runDate, "boardCode":queryResult.boardCode};
		updateStgRecord(emseUpdateParameters);
	}
}

function isValidTypeClass(queryResult)
{
	var isValidTypeClass = false;
	if(getPCSApplicationType(queryResult))
	{
		isValidTypeClass = true;
	}
	return isValidTypeClass;
}

function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

function requiredFieldErrorMessage(queryResult)
{
	var requiredFields = new Array();
	
	if (queryResult.boardCode == "SA" && queryResult.recordType == "2")
	{
		requiredFields = "boardCode - " + queryResult.boardCode + 
		", " + "typeClass - " + queryResult.typeClass + 
		",  " +"firstName - " + queryResult.firstName + 
		",  " +"lastName - " + queryResult.lastName + 
		",  " +"dateOfBirth - " + queryResult.dateOfBirth + 
		",  " +"socSecNumber - " + queryResult.socSecNumber.substr(queryResult.socSecNumber - 4) + 
		",  " + "addrs1stLn - " + queryResult.addrs1stLn +  
		",  " +"cityTwn - " + queryResult.cityTwn + 
		",  " +"state - " + queryResult.state + 
		",  " + "zipCodeA - " + queryResult.zipCodeA;
	}
	else if (queryResult.boardCode == "PD" &&  queryResult.recordType == "2")
	{
		requiredFields = "recordType - " + queryResult.recordType + ", " +"cashNumber - " + queryResult.cashNumber + ",  " +"cashDate - " + queryResult.cashDate + ",  " +"examDate - " + queryResult.examDate;
	}
	
	return requiredFields;
}

// POC
/**
 * @description Get the record count in the staging table to be processed.
 * @param  {string} serviceProviderCode
 * @param  {string} batchInterfaceName
 * @param  {date} runDate
 * @return {int} record count
 */
function countStagingRecords(runDate) {
    var count = 0;
    try {
        var array = [];
        var tableName = selectQueryObj.selectQuery.table;

        var stagingQueryParameters = {
            "runDate": runDate,
            "tableName": tableName
        };
        
        var dataSet = getStgRecords(stagingQueryParameters);

        var queryResult = null;
        while ((queryResult = dataSet.next()) != null) {
            count++;
        }

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return count;
}

// POC
/**
 * @description Query records from the staging table and returns a DataSet
 * @param  {array} parameters
 * @return {DataSet} DataSet object
 */
function getStgRecords(parameters) {
    var dataSet = null;
    try {
    	// var alterSql = "ALTER SESSION set nls_date_format = 'DD-MON-YYYY HH24:MI:SS'";
    	// var alterStm = dbConn.createStatement();
    	// alterStm.executeUpdate(alterSql);

        var stmt = null;
        var sql = "select * from " + parameters["tableName"];
    	if (parameters["runDate"] == null) {
    		sql += " WHERE INTAKE_STATUS = ? order by LICENSE_NUMBER asc";
	        stmt = dbConn.prepareStatement(sql);
	        stmt.setString(1, parameters["intakeStatus"]);
    	} else {
    		sql += " WHERE RUN_DATE like ? order by LICENSE_NUMBER asc";
            stmt = dbConn.prepareStatement(sql);
	        var sql_date = new java.sql.Date(parameters["runDate"].getTime());
	        stmt.setDate(1, sql_date);
    	}

        ELPLogging.debug("**INFO: Inside getStgRecords. SQL = " + sql);
        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}

function getErrorReportRecords(parameters) {
	var dataSet = null;
    try {
    	// var hasRunDate = false;
    	// var alterSql = "ALTER SESSION set nls_date_format = 'DD-MON-YYYY HH24:MI:SS'";
    	// var alterStm = dbConn.createStatement();
    	// alterStm.executeUpdate(alterSql);

        var stmt = null;
        var sql = "select * from " + parameters["tableName"] + " where batchInterfaceName = ? and run_date like ?";
        stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["batchInterfaceName"]);
        var sql_date = new java.sql.Date(parameters["runDate"].getTime());
        stmt.setDate(2, sql_date);

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}