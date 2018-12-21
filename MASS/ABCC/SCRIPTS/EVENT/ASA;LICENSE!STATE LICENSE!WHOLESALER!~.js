/*
 * Program: ASA;License!State License!Wholesaler!~.js
 * Event: ApplicationSubmitAfter
 *
 * 1st function:
 * 1. Assess and invoice All Alcohol License Fee $10,000
 * 2. Assess and invoice Wine and Malt <7.5K License Fee $3,500
 * 3. Assess and invoice Wine and Malt >7.5K - 10K License Fee $4,000
 * 4. Assess and invoice Wine and Malt > 10K License Fee $5,000
 * 5. Assess and invoice Sacramental Wine License Fee $3,000 
 * 
 * 2nd function: Add the Storage Permit Fee ($2,000 per row in the ASIT)
 *
 * 3rd function: On the Business contact, create a Mailing address that is the same as the Business address if the user indicates that they are the same address
 */
if (appMatch("License/State License/Wholesaler/Application") || appMatch("License/State License/Wholesaler/Renewal")) {
   CWM_ELP_57_ASA_ABCC_WholesalerFeeCalc();
   //CWM_ELP_261_ASA_ABCC_AddStorageFee();
   //copyBusinessAddressToMailing();
}