/***********************************************************************************************************************************
* @Title 		: 	EMSE_DPL_INT_PEARSON_VUE_BR_INTAKE
* @Author		:	Abhay Tripathi
* @Date			:	03/08/2016
* @Description 	:	This interface will create the application record, link exam info to application record, create license record 
* 					retrieved from the Pearson VUE exam vendor and will update the exam score on application records for BR board.
*					Barbers board processes the following record types:
*						- A (Apprentice)
*						- M (Master)
*                                                                                            
***********************************************************************************************************************************/

var VENDOR = "VUE";

/**
 * @desc This method process Business Logic for Barber Board.
 * @param {queryResult} queryResult - contains query result from staging table.
 */
function evaluateBRStgRecords(queryResult){
	ELPLogging.debug("Evaluating staging record for board code : " +queryResult.boardCode);
	//Local variable declaration
	var validationFlag = true;
	if(validateTypeClassForBR(queryResult))
	{
		if(licenseData.checkLicenseNumber(queryResult, ""))
		{
			ELPLogging.debug("Processing "+queryResult.typeClass+" records");
			
			// Required fields check
			if(validateReqdFieldsForBR(queryResult)) 
			{
				/**********************************************Lapsed Logic***********************************************/
				var foundLapsedApplicant = false;
				
				// Process logic to find lapsed licenses
				var capId = locateLapsedApplicationRecord(queryResult.socSecNumber);
				ELPLogging.debug("Lapsed Cap ID : " + capId);
				// Found a Lapsed license so proceed with it.
				
				if(capId != null)
				{
					foundLapsedApplicant = true;
					ELPLogging.debug("Found Lapsed record : " + capId);
					
					var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
					ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
					//Application configuration is 
					var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
					ELPLogging.debug("Application configuration information : " +appConfigInfo);
					
					//Performing validation for license number
					var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo)
					ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
					if(licenseValidationArray.validationResult == true)
					{
						var licenseExpDateValidationFlag = licenseData.validateExpirationDate(queryResult, appConfigInfo);
						ELPLogging.debug("licenseExpDateValidationFlag = "+licenseExpDateValidationFlag);
						// Add an error for invalid expiration date.
						if(!licenseExpDateValidationFlag)
						{
							//Add to Error Log for incorrect expiration date
							var recordID;
							if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid expiration date : "+queryResult.licExpiryDate;
							updateErrorTable(recordID, errorDescription);
						}
						ELPLogging.debug("All validations are successful for BR board.");
						// Get the exam Name for type class
						var examNameArray = evaluateExamNameforBR(queryResult, true);
						//Create exam record
						for(index in examNameArray)
						{
							createExamRecordForBR(queryResult, capId, examNameArray[index]);
						}
						
						//Check if license record already exists in Accela system
						if(licenseData.checkLicenseNumber(queryResult, capId))
						{
							// Determine the ASI value for "What type of lapsed license do you hold?"
							var typeClassValue = getASI("What type of lapsed license do you hold?", capId);
                            
                            // JIRA 3840
                            if ( typeClassValue == 'Apprentice Barber')
                            {
                                typeClassValue = 'A';
                            }
                            else if (typeClassValue == 'Master Barber')
                            {
                                typeClassValue = 'M';
                            }
                            
							if(typeClassValue != queryResult.typeClass)
							{
								// Raise an error if the typeClass does not match the ASI value
								var recordID;
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | ASI value: "+typeClassValue+" does not match type Class of record : "+queryResult.typeClass;
								updateErrorTable(recordID, errorDescription);
							}
							
							//Creating license record for Application record
							ELPLogging.debug("Lapsed Application Case : Creating license record for Application # " +capId);
							var newLicID = licenseData.issueLicense(capId, queryResult); 
							ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
																
							//Add fee on Application record
							if(queryResult.typeClass == "A"){
								feeOnApplicationRecord(capId, 2);
							}
							else if(queryResult.typeClass == "M"){
								feeOnApplicationRecord(capId, 3);
							}
							
							//Updating EXAM VENDOR CASH INFO ASIT on Application record
							if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
							{
								updateExamVendorCashInfo(capId);
							}
						
							//Add a condition - License record resent by exam vendor on ref license for input license
							//number is less than the next sequence number	
							ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
							if(licenseValidationArray.resendFlag == true)
							{
								ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
								addResendConditionOnLicenseRecord(newLicID);
							}
							// Update the ASI values for Barber 
							updateASIValuesForBR(queryResult, newLicID);
							
							//Creating and adding Application record to monthly payment set
							createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
						}
						else
						{
							ELPLogging.debug("License record is already exists in Accela system.");						
							var recordID;
							validationFlag = false;
							//Fix for PROD Defect 7497 : Pearson Vue error log entries have no way to map to source file
							if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
							
							updateErrorTable(recordID, errorDescription);
							
							//Delete record from staging table
							var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
							deleteStgRecord(emseDeleteParameters);
						}
						
					}
					else if (licenseValidationArray.validationResult == false) 
					{
						ELPLogging.debug("Validation for license number failed."); 
						validationFlag = false;
						var recordID;
						if((queryResult.firstName != null) && (queryResult.lastName != null))
						{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
						}
						else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
						{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
						}
						
						var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
						
						//Insert record in error table
						updateErrorTable(recordID, errorDescription); 
						//Delete record from staging table
						var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
						deleteStgRecord(emseDeleteParameters);
					}
				}
				else
				{
					ELPLogging.debug("Data not found for Lapsed reords. Process 'A' or 'M' typeClass.");
				}
				/**********************************************Lapsed Logic***********************************************/
				
				// No Lapsed licenses found. Proceed with 'A' or 'M'.
				if(!foundLapsedApplicant)
				{
					var recordID;
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
					{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
					}
						
					if(queryResult.typeClass == "A")
					{
						var createNewApp = true;
						var raiseAnError = false;
						var outOfCountryApplicant = false;
						var capId = null;
					
						// Evaluate the school code Out-of-Country
						// Identify Out-of-Country Apprentice Applicants if School Code = 'BR999MA'
						
						if (queryResult.schoolGraduated == "BR999MA")
						{
							outOfCountryApplicant = true;
							createNewApp = false;
						}
	
						capId = retrieveOutOfCountryApplicationRecord(queryResult.socSecNumber);
							
						if(capId != null)
						{
							ELPLogging.debug("Found Out-of-Country application record : " + capId);
							outOfCountryApplicant = true;
							createNewApp = false;
						}
						else
						{
							createNewApp = true;
							ELPLogging.debug("Out-of-Country application record not found");
						}
					
						if(createNewApp)
						{
							//Combination of board code and type class to retrieve application configuration information from
							//"INTERFACE_CAP_TYPE" standard choice
							var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
							ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
							//Application configuration is 
							var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
							ELPLogging.debug("Application configuration information : " +appConfigInfo);
							
							//Separating group, type, sub type and category from License/Real Estate/Broker/Application 
							var scanner = new Scanner(appConfigInfo, "/");
							var group = scanner.next();
							var type = scanner.next();
							var subType = scanner.next();
							var category = scanner.next();
							var SSNValidationArray = validateSSN(queryResult.socSecNumber);
							ELPLogging.debug("SSN validation flag = " +SSNValidationArray.validationFlag);
							
							//Address validation 
							var contactAddressDetailsArray = new Array();
							var contactAddressDetailsArrayTMP = new Array();
							var addressLine1 ='';
							
							if(queryResult.zipCodeB != null)
							{
								var zip = queryResult.zipCodeA+"-"+queryResult.zipCodeB;
							}
							else
							{
								var zip = queryResult.zipCodeA;
							}
								
							if (queryResult.buildingNum != null)
							{
								addressLine1 = queryResult.buildingNum + " " + queryResult.addressLine1;
							}
							else
							{
								addressLine1 = queryResult.addressLine1;
							}
							
							var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PEARSON VUE ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
							if(isEnabledAddressValidation.toLowerCase()=='true')
							{
								ELPLogging.debug("Start Address Validation");
	
								contactAddressDetailsArrayTMP =validateAddress(addressLine1, queryResult.addressLine2, queryResult.city, queryResult.state, zip, queryResult.buildingNum, COUNTRY_CODE, queryResult.serviceProvoiderCode, SOURCE_NAME);
								
								if(!contactAddressDetailsArrayTMP)
								{
									//Contact Address Validation Failed
									//Skipping Address Validation!
									var errorMessage = "PSV Address validation failed for Contact Address:"+queryResult.boardCode;
									var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : RUN_DATE};
									callToStoredProcedure(emseInsertParameters, "errorTableInsert");
									ELPLogging.debug("Invalid Address---");
									contactAddressDetailsArray["addressLine1"] = addressLine1;
									contactAddressDetailsArray["addressLine2"] = queryResult.addressLine2;
									contactAddressDetailsArray["city"] = queryResult.cityTwn;
									contactAddressDetailsArray["state"] = queryResult.state;
									contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeB
									contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeA;
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
								ELPLogging.debug("Bypass Address Validation");
								
								contactAddressDetailsArray.addressLine1 = addressLine1;
								contactAddressDetailsArray.addressLine2 = queryResult.addressLine2;
								contactAddressDetailsArray.city = queryResult.city;
								contactAddressDetailsArray.state = queryResult.state;
								contactAddressDetailsArray.zipCodeB = queryResult.zipCodeB
								contactAddressDetailsArray.zipCodeA = queryResult.zipCodeA;
								contactAddressDetailsArray.validAddress = true;
							}
							
							//validation check for address, SSN and phone number
							if(SSNValidationArray.validationFlag == true)
							{
								// Validate exam scores
								var isExamScoreValid = validateExamScoreForBR(queryResult);
								ELPLogging.debug("isExamScoreValid : "+isExamScoreValid);
								if(isExamScoreValid)
								{
									//Validate Phone Number
									var isPhoneValid = true;
									if(queryResult.primaryPhone != null)
									{
										isPhoneValid = validatePhoneNumber(queryResult.primaryPhone);
									}
								
									// Error in the error table in case of an invalid Phone Number or invalid address
									if(!contactAddressDetailsArray.validAddress)
									{
										ELPLogging.debug("Invalid Address validation.");
										//Add to Error Log
										var recordID;
										if((queryResult.firstName != null) && (queryResult.lastName != null))
										{
											recordID = queryResult.firstName+ " " +queryResult.lastName;
										}
										else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
										{
											recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
										}
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid Address : " + contactAddressDetailsArray;
										
										updateErrorTable(recordID, errorDescription);
									}
									
									// Error in the error table in case of an invalid Phone Number or invalid address
									if(!isPhoneValid)
									{
										ELPLogging.debug("Invalid Phone Number validation.");
										//Add to Error Log
										var recordID;
										if((queryResult.firstName != null) && (queryResult.lastName != null))
										{
											recordID = queryResult.firstName+ " " +queryResult.lastName;
										}
										else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
										{
											recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
										}
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid Phone Number : "+queryResult.primaryPhone;
										
										updateErrorTable(recordID, errorDescription);
									}
								
									//Performing validation for license number
									var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo)
									ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
									if(licenseValidationArray.validationResult == true)
									{
										var licenseExpDateValidationFlag = licenseData.validateExpirationDate(queryResult, appConfigInfo);
										ELPLogging.debug("licenseExpDateValidationFlag = "+licenseExpDateValidationFlag);
										if(!licenseExpDateValidationFlag)
										{
											//Add to Error Log for incorrect expiration date
											var recordID;
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
											
											var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid expiration date : "+queryResult.licExpiryDate;
											
											updateErrorTable(recordID, errorDescription);
										}
										
										ELPLogging.debug("All validations are done for BR board.");
										
										//Create new Application record if school code is not for Out-of-Country
										
										capId = createApplicationRecord(queryResult, group, type, subType, category, contactAddressDetailsArray);
										ELPLogging.debug("Application record # " +capId+ " has been created successfully ");
																			
										ELPLogging.debug("Application record to be processed: " + capId);
										
										if (queryResult.noFeeCollected == "1")
										{
											noFeeCollected = "Active Duty";
										}
										else if(queryResult.noFeeCollected == "2")
										{
											noFeeCollected = "Veteran";
										}
										else if(queryResult.noFeeCollected == "3")
										{
											noFeeCollected = "Spouse";
										}
										else
										{
											noFeeCollected = "N/A"
										}
										
										updateASIValues(capId, "MILITARY STATUS", "Military Status", noFeeCollected);
										
										if(!contactAddressDetailsArray.validAddress)
											{
											var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
													addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capId,CONDITION_TYPE,addressconditionComment ); 											
											}
	
										// Get the exam Name for type class
										var examNameArray = evaluateExamNameforBR(queryResult, false);
										//Create exam record
										for(index in examNameArray)
										{
											createExamRecordForBR(queryResult, capId, examNameArray[index]);
										}
										
										//Add condition on reference contact for invalid SSN for regular expression
										ELPLogging.debug("Condition on reference contact for SSN flag : " +SSNValidationArray.conditionFlag);
										if(SSNValidationArray.conditionFlag == true) 
										{
											ELPLogging.debug("Add condition on reference contact for invalid SSN.");
											var conditionComment = "First Name : " +queryResult.firstName+ ", Last Name : " + queryResult.lastName;
											//add condition on reference contact
											addContactStdConditionOnRefContact(CONDITION_TYPE, INVALID_SSN_CONDITION_DESC, conditionComment, capId);
											
											//Log entry to error table for invalid SSN							
											var recordID;
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
											var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid SSN number.";
											
											//Log entry to error table for invalid SSN
											updateErrorTable(recordID, errorDescription);
										}
										
										//Check if license record already exists in Accela system
										if(licenseData.checkLicenseNumber(queryResult, capId))
										{
											//Creating license record for Application record
											ELPLogging.debug("Apprentice : Creating license record for Application # " +capId);
											var newLicID = licenseData.issueLicense(capId, queryResult); 
											ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
											
											if(!contactAddressDetailsArray.validAddress)
											{
																				var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
									addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capId,CONDITION_TYPE,addressconditionComment); 									
									}
											
											//Add fee on Application record
											feeOnApplicationRecord(capId, 3);
											
											//Updating EXAM VENDOR CASH INFO ASIT on Application record
											if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
											{
												updateExamVendorCashInfo(capId);
											}
										
											//Add a condition - License record resent by exam vendor on ref license for input license
											//number is less than the next sequence number	
											ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
											if(licenseValidationArray.resendFlag == true)
											{
												ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
												addResendConditionOnLicenseRecord(newLicID);
											}
											// Update the ASI values for Barber - Apprentice 
											updateASIValuesForBR(queryResult, newLicID, outOfCountryApplicant);
											
											//Creating and adding Application record to monthly payment set
											createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
										}
										else
										{
											ELPLogging.debug("License record is already exists in Accela system.");						
											var recordID;
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
											
											var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
											
											updateErrorTable(recordID, errorDescription);
											
											//Delete record from staging table
											var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
											deleteStgRecord(emseDeleteParameters);
										}
									}
									else if (licenseValidationArray.validationResult == false) 
									{
										ELPLogging.debug("Validation for license number failed."); 
										validationFlag = false;
										var recordID;
										if((queryResult.firstName != null) && (queryResult.lastName != null))
										{
										recordID = queryResult.firstName+ " " +queryResult.lastName;
										}
										else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
										{
										recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
										}
										
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
										
										//Insert record in error table
										updateErrorTable(recordID, errorDescription); 
										//Delete record from staging table
										var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
										deleteStgRecord(emseDeleteParameters);
									}
								}
								else 
								{
									// Exam Failed
									ELPLogging.debug("Exam Failed : Must Be Above Minimum Requirements To Pass The Exam.");
									validationFlag = false;
									var recordID;
									
									if((queryResult.firstName != null) && (queryResult.lastName != null))
									{
										recordID = queryResult.firstName+ " " +queryResult.lastName;
									}
									else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
									{
										recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
									}
									var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Exam failed : Must Be Above Minimum Requirements To Pass The Exam. Practical score is " +queryResult.practicalScore;
									
									//Insert record in error table
									updateErrorTable(recordID, errorDescription); 
									
									var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
				
									updateStgRecord(emseUpdateParameters);
								}
							}
							else
							{
								//insert record into error log and delete it from staging table
								ELPLogging.debug("Validation for SSN failed.");
								validationFlag = false;
								var recordID;
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | SSN contains alpha characters/Invalid SSN number.";
								
								//Insert record in error table
								updateErrorTable(recordID, errorDescription);
								
								var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
				
								updateStgRecord(emseUpdateParameters);
								
							}
						}
						else if (outOfCountryApplicant && capId != null)
						{
							//Combination of board code and type class to retrieve application configuration information from
							//"INTERFACE_CAP_TYPE" standard choice
							var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
							ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
							//Application configuration is 
							var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
							ELPLogging.debug("Application configuration information : " +appConfigInfo);
							
							var isExamScoreValid = validateExamScoreForBR(queryResult);
							ELPLogging.debug("isExamScoreValid : "+isExamScoreValid);
							if(isExamScoreValid)
							{
								var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo)
								ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
								if(licenseValidationArray.validationResult == true)
								{
									var licenseExpDateValidationFlag = licenseData.validateExpirationDate(queryResult, appConfigInfo);
									ELPLogging.debug("licenseExpDateValidationFlag = "+licenseExpDateValidationFlag);
									if(!licenseExpDateValidationFlag)
									{
										//Add to Error Log for incorrect expiration date
										var recordID;
										if((queryResult.firstName != null) && (queryResult.lastName != null))
										{
											recordID = queryResult.firstName+ " " +queryResult.lastName;
										}
										else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
										{
											recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
										}
																	
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid expiration date : "+queryResult.licExpiryDate;
							
										updateErrorTable(recordID, errorDescription);
									}
															
									ELPLogging.debug("All validations are done for BR board.");
																
									ELPLogging.debug("Application record to be processed: " + capId);
									// Get the exam Name for type class
									var examNameArray = evaluateExamNameforBR(queryResult, false);
									//Create exam record
									for(index in examNameArray)
									{
										createExamRecordForBR(queryResult, capId, examNameArray[index]);
									}
									
									if(licenseData.checkLicenseNumber(queryResult, capId))
									{
										//Creating license record for Application record
										ELPLogging.debug("Apprentice : Creating license record for Application # " +capId);
										var newLicID = licenseData.issueLicense(capId, queryResult); 
										ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
										
										//Add fee on Application record
										feeOnApplicationRecord(capId, 3);
										
										//Updating EXAM VENDOR CASH INFO ASIT on Application record
										if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
										{
											updateExamVendorCashInfo(capId);
										}
									
										//Add a condition - License record resent by exam vendor on ref license for input license
										//number is less than the next sequence number	
										ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
										if(licenseValidationArray.resendFlag == true)
										{
											ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
											addResendConditionOnLicenseRecord(newLicID);
										}
										// Update the ASI values for Barber - Apprentice 
										updateASIValuesForBR(queryResult, newLicID, outOfCountryApplicant);
										
										//Creating and adding Application record to monthly payment set
										createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
									}
									else
									{
										ELPLogging.debug("License record is already exists in Accela system.");						
										var recordID;
										if((queryResult.firstName != null) && (queryResult.lastName != null))
										{
											recordID = queryResult.firstName+ " " +queryResult.lastName;
										}
										else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
										{
											recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
										}
										
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
										
										updateErrorTable(recordID, errorDescription);
										
										//Delete record from staging table
										var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
										deleteStgRecord(emseDeleteParameters);
									}
								}
								else if (licenseValidationArray.validationResult == false) 
								{
									ELPLogging.debug("Validation for license number failed."); 
									validationFlag = false;
									var recordID;
									if((queryResult.firstName != null) && (queryResult.lastName != null))
									{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
									}
									else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
									{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
									}
									
									var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
									
									//Insert record in error table
									updateErrorTable(recordID, errorDescription); 
									//Delete record from staging table
									var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
									deleteStgRecord(emseDeleteParameters);
								}
							}
							else
							{
								// Exam Failed
								ELPLogging.debug("Exam Failed : Must Be Above Minimum Requirements To Pass The Exam.");
								validationFlag = false;
								var recordID;
								
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Exam failed : Must Be Above Minimum Requirements To Pass The Exam. Practical score is " +queryResult.practicalScore;
								
								//Insert record in error table
								updateErrorTable(recordID, errorDescription); 
								
								var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
			
								updateStgRecord(emseUpdateParameters);
							}
						}
						else 
						{
							// Case of application record not found.
							ELPLogging.debug("BR : Out-of-Country record application record not found.");
							
							validationFlag = false;
							//Error Message should indicate which required field is missing
							var recordID;
							if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							else if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							
							//Add to Error Log
							var errorMessage = "BR :  Out-of-Country record application record not found.";
							var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : RUN_DATE};
							callToStoredProcedure(emseInsertParameters, "errorTableInsert");
						}
					}
					else if(queryResult.typeClass == "M")
					{
						//Combination of board code and type class to retrieve application configuration information from
						//"INTERFACE_CAP_TYPE" standard choice
						var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
						ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
						//Application configuration is 
						var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
						ELPLogging.debug("Application configuration information : " +appConfigInfo);
						
						//Separating group, type, sub type and category from License/Real Estate/Broker/Application 
						var scanner = new Scanner(appConfigInfo, "/");
						var group = scanner.next();
						var type = scanner.next();
						var subType = scanner.next();
						var category = scanner.next();
						var SSNValidationArray = validateSSN(queryResult.socSecNumber);
						ELPLogging.debug("SSN validation flag = " +SSNValidationArray.validationFlag);
						
						//Address validation 
						var contactAddressDetailsArray = new Array();
						var contactAddressDetailsArrayTMP = new Array();
						var addressLine1 ='';
						if(queryResult.zipCodeB != null)
						{
							var zip = queryResult.zipCodeA+"-"+queryResult.zipCodeB;
						}
						else
						{
							var zip = queryResult.zipCodeA;
						}
						
						if (queryResult.buildingNum != null)
						{
							addressLine1 = queryResult.buildingNum + " " + queryResult.addressLine1;
						}
						else
						{
							addressLine1 = queryResult.addressLine1;
						}
						
						var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PEARSON VUE ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
						if(isEnabledAddressValidation.toLowerCase()=='true')
						{
							ELPLogging.debug("Start Address Validation");
	
							contactAddressDetailsArrayTMP =validateAddress(addressLine1, queryResult.addressLine2, queryResult.city, queryResult.state, zip, queryResult.buildingNum, COUNTRY_CODE, queryResult.serviceProvoiderCode, SOURCE_NAME);
								
							if(!contactAddressDetailsArrayTMP)
							{
								//Contact Address Validation Failed
								//Skipping Address Validation!
								var errorMessage = "PSV Address validation failed for Contact Address:"+queryResult.boardCode;
								var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : RUN_DATE};
								callToStoredProcedure(emseInsertParameters, "errorTableInsert");
								ELPLogging.debug("Invalid Address---");
								contactAddressDetailsArray["addressLine1"] = addressLine1;
								contactAddressDetailsArray["addressLine2"] = queryResult.addressLine2;
								contactAddressDetailsArray["city"] = queryResult.cityTwn;
								contactAddressDetailsArray["state"] = queryResult.state;
								contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeB
								contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeA;
								contactAddressDetailsArray.validAddress=false;
							
								/*var addressconditionComment = BAD_ADDRESS_CONDITION_COMMENT;// + " " + addressconditionComment;
								addStdConditionByConditionNumber(CONDITION_TYPE, BAD_ADDRESS_CONDITION, capId);
								editConditionComment(capId, BAD_ADDRESS_CONDITION, addressconditionComment);*/
								
							}
							else
							{
								contactAddressDetailsArray = contactAddressDetailsArrayTMP;
								contactAddressDetailsArray.validAddress=true;
							}
						}
						else
						{
							ELPLogging.debug("Bypass Address Validation");
							contactAddressDetailsArray.addressLine1 = addressLine1;
							contactAddressDetailsArray.addressLine2 = queryResult.addressLine2;
							contactAddressDetailsArray.city = queryResult.city;
							contactAddressDetailsArray.state = queryResult.state;
							contactAddressDetailsArray.zipCodeB = queryResult.zipCodeB
							contactAddressDetailsArray.zipCodeA = queryResult.zipCodeA;
							contactAddressDetailsArray.validAddress=true;
						}
						
						//validation check for address, SSN and phone number
						if(SSNValidationArray.validationFlag == true)
						{
							var isPhoneValid = true;
							if(queryResult.primaryPhone != null)
							{
								ELPLogging.debug("Validating Phone Number.");
								isPhoneValid = validatePhoneNumber(queryResult.primaryPhone);
							}
							
							// Error in the error table in case of an invalid Address
							if(!contactAddressDetailsArray.validAddress)
							{
								ELPLogging.debug("Invalid Address.");
								//Add to Error Log
								var recordID;
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid Address : " + contactAddressDetailsArray;
								
								updateErrorTable(recordID, errorDescription);
							}
							
							// Error in the error table in case of an invalid Phone Number
							if(!isPhoneValid)
							{
								ELPLogging.debug("Invalid Phone Number.");
								//Add to Error Log
								var recordID;
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid Phone Number : "+queryResult.primaryPhone;
								
								updateErrorTable(recordID, errorDescription);
							}
							
							//Performing validation for license number
							var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo)
							ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
							if(licenseValidationArray.validationResult == true)
							{
								var licenseExpDateValidationFlag = licenseData.validateExpirationDate(queryResult, appConfigInfo);
								ELPLogging.debug("licenseExpDateValidationFlag = "+licenseExpDateValidationFlag);
								if(!licenseExpDateValidationFlag)
								{
									//Add to Error Log for incorrect expiration date
									var recordID;
									if((queryResult.firstName != null) && (queryResult.lastName != null))
									{
										recordID = queryResult.firstName+ " " +queryResult.lastName;
									}
									else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
									{
										recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
									}
									
									var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid expiration date : "+queryResult.licExpiryDate;
									
									updateErrorTable(recordID, errorDescription);
								}
								
								ELPLogging.debug("All validations are successful for BR board.");
								var applicationRecordID = null;
								if (queryResult.recordID == null)
								{
									applicationRecordID = retrieveApplicationRecordViaSSN(queryResult.socSecNumber);
									queryResult.recordID = applicationRecordID;
								}
								ELPLogging.debug("Creating License record.");
								//Defect #10409 and CR# 425 fix
								if(queryResult.recordID != null)
								{
									var capListResult = aa.cap.getCapID(queryResult.recordID); 
									if (capListResult.getSuccess())
									{
										var capId = capListResult.getOutput();
										ELPLogging.debug("capId retrieved from intake file : " + capId);
										
										if(!contactAddressDetailsArray.validAddress)
											{
													var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
																addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capId,CONDITION_TYPE,addressconditionComment ); 	
											}
											
										var examNameArray = evaluateExamNameforBR(queryResult, false);
										//Create exam record
										for(index in examNameArray)
										{
											createExamRecordForBR(queryResult, capId, examNameArray[index]);
										}
										
										/*if (!contactAddressDetailsArray.validAddress)
										{
											var addressconditionComment = BAD_ADDRESS_CONDITION_COMMENT;// + " " + addressconditionComment;
											addStdConditionByConditionNumber(CONDITION_TYPE, BAD_ADDRESS_CONDITION, capId);
											editConditionComment(capId, BAD_ADDRESS_CONDITION, addressconditionComment);
										}*/
										
										//Add condition on reference contact for invalid SSN for regular expression
										ELPLogging.debug("Condition on reference contact for SSN flag : " +SSNValidationArray.conditionFlag);
										if(SSNValidationArray.conditionFlag == true) 
										{
											ELPLogging.debug("Add condition on reference contact for invalid SSN.");
											var conditionComment = "First Name : " +queryResult.firstName+ ", Last Name : " + queryResult.lastName;
											//add condition on reference contact
											addContactStdConditionOnRefContact(CONDITION_TYPE, INVALID_SSN_CONDITION_DESC, conditionComment, capId);
											
											//Log entry to error table for invalid SSN							
											var recordID;
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
											var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid SSN number.";
											
											//Log entry to error table for invalid SSN
											updateErrorTable(recordID, errorDescription);
										}
										
										//Check if license record already exists in Accela system
										if(licenseData.checkLicenseNumber(queryResult, capId))
										{
											//Creating license record for Application record
											ELPLogging.debug("Master : Creating license record for Application # " +capId);
											var newLicID = licenseData.issueLicense(capId, queryResult); 
											ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
											
											if(!contactAddressDetailsArray.validAddress)
											{
												var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
															addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capId,CONDITION_TYPE,addressconditionComment ); 											
											}
											//Add fee on Application record
											feeOnApplicationRecord(capId, 3);
											//Updating EXAM VENDOR CASH INFO ASIT on Application record
											if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
											{
												updateExamVendorCashInfo(capId);
											}
										
											//Add a condition - License record resent by exam vendor on ref license for input license
											//number is less than the next sequence number	
											ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
											if(licenseValidationArray.resendFlag == true)
											{
												ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
												addResendConditionOnLicenseRecord(newLicID);
											}
											// Update the ASI values for Barber - Master 
											updateASIValuesForBR(queryResult, newLicID);
											
											var apprenticeLicenseID =  getASI("What is your current MA Apprentice license number?", capId);
											// Find related Type Class 'A' license (same reference contact) and set Workflow status to 'Upgraded'.
											checkForAssociatedLicenses(queryResult, apprenticeLicenseID);
											
											//Creating and adding Application record to monthly payment set
											createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
										}
										else
										{
											ELPLogging.debug("License record is already exists in Accela system.");						
											var recordID;
											//Fix for PROD Defect 7497 : Pearson Vue error log entries have no way to map to source file
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
											
											var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
											
											updateErrorTable(recordID, errorDescription);
											
											//Delete record from staging table
											var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
											deleteStgRecord(emseDeleteParameters);
										}
									}
									else
									{
										ELPLogging.debug("Invalid Master record ID "+queryResult.recordID +" found.");
										validationFlag = false;
										
										//Add record to error table
										var recordID;
										if(queryResult.recordID != null)
										{
											recordID = queryResult.recordID;
										}
										else
										{
											if((queryResult.firstName != null) && (queryResult.lastName != null))
											{
												recordID = queryResult.firstName+ " " +queryResult.lastName;
											}
											else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
											{
												recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
											}
										}
										
										var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid record ID "+queryResult.recordID +" found.";
										
										updateErrorTable(recordID, errorDescription);
										
										//Delete record from staging table
										var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
										deleteStgRecord(emseDeleteParameters);
									}
								}
								else
								{
									validationFlag = false;
									var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Application record not found for :" + queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass;
										
									updateErrorTable(recordID, errorDescription);
									
									var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
				
									updateStgRecord(emseUpdateParameters);
								}
							}
							else if (licenseValidationArray.validationResult == false) 
							{
								ELPLogging.debug("Validation for license number failed."); 
								validationFlag = false;
								var recordID;
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
								
								var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
								
								//Insert record in error table
								updateErrorTable(recordID, errorDescription); 
								//Delete record from staging table
								var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
								deleteStgRecord(emseDeleteParameters);
							}
						}
						else
						{
							//insert record into error log and delete it from staging table
							ELPLogging.debug("Validation for SSN failed.");
							validationFlag = false;
							var recordID;
							if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | SSN contains alpha characters/Invalid SSN number.";
							
							//Insert record in error table
							updateErrorTable(recordID, errorDescription);
							
							var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
				
							updateStgRecord(emseUpdateParameters);
						}
					} // End If for typeClass 'A' or 'M'
				}
			}
			else
			{
				validationFlag = false;
				var requiredFieldForBRBoard = "BOARD-CODE = " +queryResult.boardCode +
												",LICENSE-NUMBER = " +queryResult.licenseNumber +
												", TYPE-CLASS = " +queryResult.typeClass +
												", SOC-SEC-NUMBER = " +queryResult.socSecNumber +
												", FIRST-NAME = " +queryResult.firstName +
												", LAST-NAME = " +queryResult.lastName +
												", CASH-NUMBER = " +queryResult.cashNumber +
												", CASH-DATE = " +queryResult.cashDate +
												", ISSUE-DATE = " +queryResult.licIssueDate +
												", LIC-EXPIR-DATE = " +queryResult.licExpiryDate +
												", ADDRS-LN-1 = " +queryResult.addressLine1 + 
												", CITY-TWN = " +queryResult.city +
												", STATE = " +queryResult.state +
												", ZIP-CODEA = " +queryResult.zipCodeA + 
												", DATE-OF-BIRTH = " +queryResult.dateOfBirth + 
												", EXAM-DATE = " +queryResult.examDate +
												", WRITTEN-SCORE-1 = " +queryResult.writtenScore1 +
												", PRACTICAL-SCORE = " +queryResult.practicalScore;
				
				// Case of a required field missing.
				ELPLogging.debug("BR : Record missing one or more required fields - "+requiredFieldForBRBoard);
				
				validationFlag = false;
				//Error Message should indicate which required field is missing
				var recordID;
				if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				else if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				
				//Add to Error Log
				var errorMessage = "BR : Record missing one or more required fields - : "+requiredFieldForBRBoard;
				var emseInsertParameters = {"BatchInterfaceName" : queryResult.batchInterfaceName, "RecordID" : recordID,"ErrorDescription" : errorMessage,"runDate" : RUN_DATE};
				callToStoredProcedure(emseInsertParameters, "errorTableInsert");
				
				var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorMessage}
				
				updateStgRecord(emseUpdateParameters);
							
				ELPLogging.debug("Finished updating VUE staging table.");
			}
		}
		else
		{
			var recordID;
						
			if (queryResult.recordID != null)
			{
				recordID = queryResult.recordID;
			}
			else if((queryResult.firstName != null) && (queryResult.lastName != null))
			{
				recordID = queryResult.firstName+ " " +queryResult.lastName;
			}
			else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
			{
				recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
			}
			
			var errorDescription = "License number already exists in Accela: "+queryResult.licenseNumber;
			
			updateErrorTable(recordID, errorDescription);
			
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
			updateStgRecord(updateParameters);
		}
	}
	else
	{	
		ELPLogging.debug("Case of an Invalid Type Class for BR Board.");
		//Do not process record
		validationFlag = false;
		//Add record to error table			
		var recordID;
		if((queryResult.firstName != null) && (queryResult.lastName != null))
		{
			recordID = queryResult.firstName+ " " +queryResult.lastName;
		}
		else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
		{
			recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
		}
		
		// Update error message
		var errorDescription = "Type Class : "+queryResult.typeClass+" | File Name : "+fileName+" | Invalid type Class found.";
		updateErrorTable(recordID, errorDescription);
		
		// Delete record from staging table
		var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
		deleteStgRecord(emseDeleteParameters);
	}
	return validationFlag;
}


/**
 * @desc This method validates the typeClass values associated with Barber board.
 * @param {queryResult} queryResult - contains query result from staging table.
 */
function validateTypeClassForBR(queryResult)
{
	var isValidTypeClass = false;
	var typeClassArray = new Array("A","M");
	
	if(exists(queryResult.typeClass,typeClassArray))
	{
		isValidTypeClass = true;
	}
	
	return isValidTypeClass;
}

/**
 * @desc This method validates the required fields for Barbers board.
 * @param {queryResult} queryResult - contains query result from staging table.
 */
function validateReqdFieldsForBR(queryResult) {
	ELPLogging.debug("Validating required fields for board code : "+queryResult.boardCode);
	
	if (queryResult.boardCode == null ||
		queryResult.boardCode.trim().length == 0 ||
		queryResult.licenseNumber == null || 
		queryResult.licenseNumber.trim().length == 0 ||
		queryResult.typeClass == null || 
		queryResult.typeClass.trim().length == 0 ||
		queryResult.socSecNumber == null ||
		queryResult.socSecNumber.trim().length != 9 ||	
		queryResult.firstName == null ||
		queryResult.firstName.trim().length == 0 ||
		queryResult.lastName == null ||
		queryResult.lastName.trim().length == 0 ||
		queryResult.cashNumber == null ||
		queryResult.cashNumber.trim().length != 6 ||
		queryResult.cashDate == null ||
		queryResult.licIssueDate == null ||
		queryResult.licExpiryDate == null ||
		queryResult.addressLine1 == null ||
		queryResult.addressLine1.trim().length == 0 ||
		queryResult.city == null ||
		queryResult.city.trim().length == 0 ||
		queryResult.state == null ||
		queryResult.state.trim().length == 0 ||
		queryResult.zipCodeA == null ||
		queryResult.zipCodeA.trim().length == 0 ||
		queryResult.dateOfBirth == null ||
		queryResult.examDate == null ||
		queryResult.writtenScore1 == null ||
		queryResult.practicalScore == null)
	{
		return false;
	} 
	else
	{
		return true;
	}	
}

/**
 * @desc This method validates the exam score fields for Barbers board.
 * @param {queryResult} queryResult - contains query result from staging table.
 */
function validateExamScoreForBR(queryResult)
{
	ELPLogging.debug("Validating exam score.");
	var isValidExamScore = false;
	
	if((queryResult.writtenScore1 >= 70) && (queryResult.practicalScore >= 70))
	{
		isValidExamScore = true;
	}
	
	return isValidExamScore;
}

/**
 * @desc This method create exam record.
 * @param {capId} Cap ID - contains record ID.
 * @param {queryResult} queryResult - contains queryResult from staging table.
 * @param {examName} exam name - contains exam name.
 */
function createExamRecordForBR(queryResult, capId, examName)
{
	ELPLogging.debug("Creating exam record of board = " +queryResult.boardCode + " for Application : " +capId);
	//Local variable declaration
	var passingScore = BR_PASSING_SCORE;
	var providerName = "Pearson Vue";
	
	//Retrieve provider name
	var providerNumber = getProviderNumber(examName, providerName);
	ELPLogging.debug("Provider Number : " +providerNumber);
	/* providerNumber = "14";
	ELPLogging.debug("Provider Number2 : " +providerNumber); */
	
	var newExamScriptModel = aa.examination.getExaminationModel().getOutput();
    newExamScriptModel.setServiceProviderCode(queryResult.serviceProviderCode);
    newExamScriptModel.setRequiredFlag("Y");

    var examModel =  newExamScriptModel.getExaminationModel();

    // Create Exam model for new record.
    examModel.setB1PerId1(capId.getID1());
    examModel.setB1PerId2(capId.getID2());
    examModel.setB1PerId3(capId.getID3());
    examModel.setExamName(examName);	
    examModel.setProviderNo(providerNumber);	
    examModel.setProviderName(providerName);					
    newExamScriptModel.setAuditStatus("A");
    
	// Practical exams
	if((examName == "Barber Practical Exam") ||(examName == "Practical"))
	{
		if (queryResult.practicalScore >= BR_PASSING_SCORE)
		{
			examModel.setExamStatus("PCOMPLETED");
			ELPLogging.debug("Exam is completed.");
		}
		else
		{
			examModel.setExamStatus("PENDING");
			ELPLogging.debug("Exam is pending.");
		}
		if(queryResult.practicalScore != null)
			examModel.setFinalScore(aa.util.parseDouble(queryResult.practicalScore));
	}
	// Written Exams
	else if((examName == "Barber Written Exam") || (examName == "Written"))
	{
		if (queryResult.writtenScore1 >= BR_PASSING_SCORE)
		{
			examModel.setExamStatus("PCOMPLETED");
			ELPLogging.debug("Exam is completed.");
		}
		else
		{
			examModel.setExamStatus("PENDING");
			ELPLogging.debug("Exam is pending.");
		}
		examModel.setFinalScore(aa.util.parseDouble(queryResult.writtenScore1));
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
}

/**
 * @desc This method updates the ASI values for Barbers Board.
 * @param {queryResult} queryResult - contains queryResult from staging table.
 * @param {capIDModel} Cap ID - contains record ID.
 */
function updateASIValuesForBR(queryResult, capIDModel, isOutOfCountryApplicant)
{
	ELPLogging.debug("Updating Military status record : "+capIDModel);
	//Local variable declaration
	var noFeeCollected;
	
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A"
	}
	ELPLogging.debug("No Fee Collected : " +noFeeCollected);
	
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);
	
	// Copy Type Class to ASI 'Type Class'
	updateASIValues(capIDModel, "TYPE CLASS", "Type Class", queryResult.typeClass);
	
	if(queryResult.typeClass == "A") {
		if(isOutOfCountryApplicant){
			updateASIValues(capIDModel, "OUT OF COUNTRY", "Out of Country", "Y");
		}
		else if(!isOutOfCountryApplicant){
			updateASIValues(capIDModel, "OUT OF COUNTRY", "Out of Country", "N");
		}
	}
}

/**
 * @desc This method populates an array of exam names based on the typeclass of record for Barbers Board.
 * @param {queryResult} queryResult - contains queryResult from staging table.
 * @param {capId} Cap ID - contains record ID.
 * @param {appConfigInfo} Cap ID - contains record ID.
 */
function evaluateExamNameforBR(queryResult, forLapsed)
{
	ELPLogging.debug("Evaluating ExamName.");
	var examNameArray = new Array();

	if(queryResult.typeClass == "A")
	{
		ELPLogging.debug("Apprentice Exam Name(s).");
		if(forLapsed)
		{
			examNameArray.push("Barber Practical Exam");
		}
		else 
		{
			examNameArray.push("Barber Written Exam");
			examNameArray.push("Barber Practical Exam");
		}
	}
	else if(queryResult.typeClass == "M")
	{
		ELPLogging.debug("Master Exam Name(s).");
		if(forLapsed){
			examNameArray.push("Barber Practical Exam");
		}
		else {
			examNameArray.push("Barber Written Exam");
			examNameArray.push("Barber Practical Exam");
		}
	}
	
	return examNameArray;
}

/**
 * @desc This method retrieves the school code.
 */
function getSchoolCode(){
	
	/* Create a Std Choice PVUE_BR_School_Code to maintain a static entry */
	
	var desiredValue = "SchoolCode";
	var code = "";
	var biz = aa.bizDomain.getBizDomainByValue("PVUE_BR_School_Code", desiredValue);
	if(desiredValue == "SchoolCode")
	{
		if(biz.getSuccess()){
			code = biz.getOutput().getDescription();
		}
		else{
			ELPLogging.debug("There was an error retrieving the description from the biz model.");
		}
	}
	else
	{
		ELPLogging.debug("Improper parameter value.");
	}

	return code;
}

/**
 * @desc This method retrieve record ID of the Out-of-Country application based on social security number.
 * @param {socialSecurityNumber} socialSecurityNumber - contains the contact sequence number.
 */
function retrieveOutOfCountryApplicationRecord(socialSecurityNumber)
{
	ELPLogging.debug("Retrieving record ID from Social security number : " +socialSecurityNumber);
	//Local variable declaration
	var appDetailsArray = new Array();
	var capID;
	var altID;
	
	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode("DPL");
	/* peopleScriptModel.setContactType("Licensed Individual"); */
	/* peopleScriptModel.setContactType("Applicant"); */
	var SSN = formatSSN(socialSecurityNumber);
	peopleScriptModel.setSocialSecurityNumber(SSN);

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if(peopleResult.getSuccess())
	{
		var capIDScriptModel = peopleResult.getOutput();
		
		for(index in capIDScriptModel)
		{
			capID = capIDScriptModel[index].getCapID();	
			capID = aa.cap.getCapID(capID.getID1(),capID.getID2(),capID.getID3()).getOutput();
			
			//Adding ALTID and capID to appDetailsArray
			appDetailsArray.altID = capID.getCustomID();
			appDetailsArray.capID = capID;
			
			//Retrieving record details from appDetailsArray
			var isValidApplication = validateOutOfCountryApplicationRecord(capID);
			
			if(isValidApplication){
				break;
			}
			else {
				capID = null;
			}
		}
	}
	else
	{	
		ELPLogging.debug("WARNING: error searching for people : " + peopleResult.getErrorMessage());
	}
	return capID;
}

/**
 * @desc This method validates if the capId is valid Out-of-Country application record.
 * @param {capId} Cap ID - contains record ID.
 * @return (isValidApplication) returns boolean value.
 */
function validateOutOfCountryApplicationRecord(capId)
{
	var isValidApplication = false;
	var isContactTypeValid = false;
	var isValidSSN = false;
	var OUTOFCOUNTRY_APP_CONFIGURATION;
	var boardFlag = false;
	var recordFoundFlag = false;
	
	if (queryResult.boardCode == "HD")
	{
		OUTOFCOUNTRY_APP_CONFIGURATION = "LICENSE/COSMETOLOGY/OUT OF STATE/APPLICATION";
		boardFlag = true;
	}
	else
	{
		OUTOFCOUNTRY_APP_CONFIGURATION = "LICENSE/BARBERS/OUT OF COUNTRY APPRENTICE/APPLICATION";
	}
	
	var isValidWFStatus = getTaskUser(capId);
	ELPLogging.debug("isValidWFStatus : "+isValidWFStatus);
	
	var capModelResult = aa.cap.getCap(capId);
	if(capModelResult.getSuccess())
	{
		var capScriptModel = capModelResult.getOutput();
		var capType = capScriptModel.getCapType();
		
		ELPLogging.debug("CapType : "+capType.toString().toUpperCase());
		
		if (boardFlag)
		{
			if(capType.toString().toUpperCase().equals("LICENSE/COSMETOLOGY/OUT OF COUNTRY/APPLICATION"))
			{
				recordFoundFlag = true;
			}
			else if(capType.toString().toUpperCase().equals("LICENSE/COSMETOLOGY/INSTRUCTOR/APPLICATION"))
			{
				recordFoundFlag = true;
			}
			else if(capType.toString().toUpperCase().equals("LICENSE/COSMETOLOGY/FORFEITURE/APPLICATION"))
			{
				recordFoundFlag = true;
			}
			else
			{
				recordFoundFlag = false;
			}
		}
		
		if(capType.toString().toUpperCase().equals(OUTOFCOUNTRY_APP_CONFIGURATION) || recordFoundFlag)
		{
			ELPLogging.debug("Cap type is : " +capType);
			
			//Get contacts associated with the capid
			var capContactResult = aa.people.getCapContactByCapID(capId);
			var capContactList = capContactResult.getOutput();
			if(capContactList)
			{
				for(index in capContactList)
				{
					thisCapContact = capContactList[index];
					thisPeople = thisCapContact.getPeople();
					
					var capContactType = capContactList[index].getPeople().getContactType();
					if(capContactType == "Applicant")
					{
						isContactTypeValid = true;
						
						var SSN = capContactList[index].getPeople().getSocialSecurityNumber();
						var scanner = new Scanner(SSN,"-");
						SSN = scanner.next()+scanner.next()+scanner.next();
						if(SSN == queryResult.socSecNumber)
						{
							ELPLogging.debug("Out-of-Country application found.");
							isValidSSN = true;	
							break;
						}
					}
				}
			}
			
			ELPLogging.debug("isValidSSN : "+isValidSSN+" isContactTypeValid : "+isContactTypeValid+" isValidWFStatus: "+isValidWFStatus);
			if(isValidSSN && isContactTypeValid && isValidWFStatus)
			{
				isValidApplication = true;
			}
		}
	}
	
	return isValidApplication;
}

/**
 * @desc This method checks if the workflow status of the record is Approved to Sit for Exam or not.
 * @param {capIDModel} Cap ID - contains record ID.
 * @return (isValidWFStatus) returns boolean value.
 */
function getTaskUser(capIDModel) 
{
	var isValidWFStatus = false;
	var workflowTask = "Validate";
	var workflowStatus = "Approved to Sit for Exam";
		
	var allTasks = aa.workflow.getTaskItemByCapID(capIDModel, null).getOutput();
	for(count in allTasks) 
	{
		var task = allTasks[count].getTaskItem().getTaskDescription();
		if(task == workflowTask)
		{
			var status = allTasks[count].getDisposition();
			if(status == workflowStatus)
			{
				isValidWFStatus = true;
			}
		}
	}
	return isValidWFStatus;
}

/**
 * @desc This method retrieve record ID of the lapsed application based on social security number.
 * @param {socialSecurityNumber} socialSecurityNumber - contains the contact sequence number.
 */
function locateLapsedApplicationRecord(socialSecurityNumber)
{
	ELPLogging.debug("Retrieving record ID from Social security number : " +socialSecurityNumber);
	//Local variable declaration
	var appDetailsArray = new Array();
	var capID = null;
	var altID;
	
	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode("DPL");
	/* peopleScriptModel.setContactType("Licensed Individual"); */
	/* peopleScriptModel.setContactType("Applicant"); */
	var SSN = formatSSN(socialSecurityNumber);
	peopleScriptModel.setSocialSecurityNumber(SSN);

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if(peopleResult.getSuccess())
	{
		var capIDScriptModel = peopleResult.getOutput();
		
		for(index in capIDScriptModel)
		{
			capID = capIDScriptModel[index].getCapID();	
			capID = aa.cap.getCapID(capID.getID1(),capID.getID2(),capID.getID3()).getOutput();
			
			//Retrieving record details from appDetailsArray
			isValidApplication = validateLapsedApplicationRecord(capID);
			
			if(isValidApplication){
				break;
			}
			else {
				capID = null;
			}
		}
	}
	else
	{	
		ELPLogging.debug("WARNING: error searching for people : " + peopleResult.getErrorMessage());
	}
	return capID;
}


/**
 * @desc This method validates if the capId is valid for Lapsed application record.
 * @param {capId} Cap ID - contains record ID.
 * @return (isValidApplication) returns boolean value.
 */
function validateLapsedApplicationRecord(capId)
{
	var isValidApplication = false;
	var isContactTypeValid = false;
	var isValidSSN = false;
	var LAPSED_APP_CONFIGURATION = "LICENSE/BARBERS/LAPSED/APPLICATION";
	
	var isValidWFStatus = getTaskUser(capId);
	ELPLogging.debug("isValidWFStatus : "+isValidWFStatus);
	
	var capModelResult = aa.cap.getCap(capId);
	if(capModelResult.getSuccess())
	{
		var capScriptModel = capModelResult.getOutput();
		var capType = capScriptModel.getCapType();
		
		if(capType.toString().toUpperCase().equals(LAPSED_APP_CONFIGURATION))
		{
			ELPLogging.debug("Cap type is : " +capType);
			
			//Get contacts associated with the capid
			var capContactResult = aa.people.getCapContactByCapID(capId);
			var capContactList = capContactResult.getOutput();
			if(capContactList)
			{
				for(index in capContactList)
				{
					thisCapContact = capContactList[index];
					thisPeople = thisCapContact.getPeople();
					
					var capContactType = capContactList[index].getPeople().getContactType();
					if(capContactType == "Applicant" || capContactType == "Licensed Individual")
					{
						isContactTypeValid = true;
						
						var SSN = capContactList[index].getPeople().getSocialSecurityNumber();
						var scanner = new Scanner(SSN,"-");
						SSN = scanner.next()+scanner.next()+scanner.next();
						if(SSN == queryResult.socSecNumber)
						{
							isValidSSN = true;	
							break;							
						}
					}
				}
			}
			
			ELPLogging.debug("isValidSSN : "+isValidSSN+" isContactTypeValid : "+isContactTypeValid+" isValidWFStatus: "+isValidWFStatus);
			if(isValidSSN && isContactTypeValid && isValidWFStatus)
			{
				ELPLogging.debug("Lapsed application found.");
				isValidApplication = true;
			}
		}
	}
	
	return isValidApplication;
}

/** 
 * @desc This method checks for any Type Class 'A' licenses with same reference contact and set WF status to 'Upgraded'
 * @param {queryResult} queryResult - queryResult from staging table.
 * @param {newLicID} newLicID - Newly created license ID.
 */
function checkForAssociatedLicenses(queryResult, apprenticeLicenseID)
{
	var scanner = new Scanner(apprenticeLicenseID,"-");

	apprenticeLicenseID = scanner.next() +"-BR-A";


	var associatedCapId = aa.cap.getCapID(apprenticeLicenseID).getOutput();

	//Close Work flow
	//Fixes for defect 6003- Do not close the workflow task while upgrading
	//closeLicWorkflowForAssociatedLicense(associatedCapId);
	
	if (associatedCapId)
	{
		ELPLogging.debug("associatedCapId = "+associatedCapId);
		//Update the status of apprentice license to 'Upgraded'
		updateAppStatus("Upgraded", "Automatic update through script PSV Interface", associatedCapId);
		updateTaskStatus("License", "Upgraded", "","","", associatedCapId);
		
		//Get LicenseProfessions based on capID.
		var licModels = aa.licenseProfessional.getLicensedProfessionalsByCapID(associatedCapId).getOutput();
		
		for (index in licModels)
		{
			var licModel = licModels[index];
			//Check the license number with the once extracted from the ASI
			ELPLogging.debug("licModel.licenseType--" + licModel.licenseType);
			if (licModel.licenseType == "Apprentice Barber")
			{
				var apprenticeASILicNo = licModel.licenseNbr;
				ELPLogging.debug("apprenticeASILicNo = "+apprenticeASILicNo);
				//If same, then disable the LP record
				// Changing the status of Ref LP
				var licProf = aa.licenseScript.getRefLicensesProfByLicNbr("DPL", apprenticeASILicNo).getOutput();
	
				for (i in licProf)
				{
					var indLicProf = licProf[i];
					var type = indLicProf.getLicenseType();
					ELPLogging.debug("type = "+type);
					if (type != "Apprentice Barber")
						continue;
					indLicProf.setWcExempt("N");
					indLicProf.setPolicy("Upgraded");
					aa.licenseScript.editRefLicenseProf(indLicProf);
					var result = aa.licenseScript.updateLicenseStatusByTypeAndNbr(type, apprenticeASILicNo, "A");
					ELPLogging.debug("Success: " + result.getSuccess());
				}
			}
		}
	}
	else
	{
		ELPLogging.debug("Apprentice License ASI empty on Application record or Invalid License number : " + associatedCapId)
	}
}


function retrieveApplicationRecordViaSSN(socialSecurityNumber)
{
	ELPLogging.debug("Retrieving record ID from Social security number : " +socialSecurityNumber);
	//Local variable declaration
	var appDetailsArray = new Array();
	var tmpCapID = null;
	var capID = null;
	var altID;
	
	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode("DPL");
	/* peopleScriptModel.setContactType("Licensed Individual"); */
	/* peopleScriptModel.setContactType("Applicant"); */
	var SSN = formatSSN(socialSecurityNumber);
	peopleScriptModel.setSocialSecurityNumber(SSN);

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if(peopleResult.getSuccess())
	{
		var capIDScriptModel = peopleResult.getOutput();
		
		for(index in capIDScriptModel)
		{
			tmpCapID = capIDScriptModel[index].getCapID();	
			tmpCapID = aa.cap.getCapID(tmpCapID.getID1(),tmpCapID.getID2(),tmpCapID.getID3()).getOutput();
			
			//Adding ALTID and capID to appDetailsArray
		//	appDetailsArray.altID = capID.getCustomID();
			//appDetailsArray.capID = capID;
			
			var capModelResult = aa.cap.getCap(tmpCapID);
			if(capModelResult.getSuccess())
			{
				var capScriptModel = capModelResult.getOutput();
				var capType = capScriptModel.getCapType();
				
				ELPLogging.debug("CapType : "+capType.toString().toUpperCase());
				
				if(capType.toString().toUpperCase().equals("LICENSE/BARBERS/MASTER/APPLICATION"))
				{
					recordFoundFlag = true;
					capID = tmpCapID.getCustomID();
					ELPLogging.debug("Application record found # "+ capID);
					break;
				}
			}
		}
	}
	else
	{	
		ELPLogging.debug("WARNING: error searching for people : " + peopleResult.getErrorMessage());
	}
	return capID;
}