create or replace PROCEDURE "ELP_SP_PROMOTE_DOCUMENTS" 
(
  AGENCY IN VARCHAR2
  --sp_cursor OUT sys_refcursor
)
AS 
--Used to raise null value exception
null_value EXCEPTION; 
PRAGMA exception_init(null_value, -20001);
v_erm varchar2(64);
v_ent_id varchar2(20);
v_count integer:=0; 

BEGIN

  IF AGENCY is NULL THEN
    raise null_value;
  END IF;

/*--Script Start---------------------------------------------------------------------------------*/

DECLARE CURSOR failed_docs_cursor IS
SELECT distinct ENT_ID FROM "ACCELA"."BDOCUMENT" WHERE serv_prov_code=AGENCY AND ENT_TYPE='TMP_CAP' AND (B1_PER_ID1||'-'||B1_PER_ID2||'-'||B1_PER_ID3)<>ENT_ID
AND SOURCE='ACCELA' AND REC_STATUS='A' AND B1_PER_ID1 IS NOT NULL;

BEGIN
OPEN failed_docs_cursor;
LOOP
  FETCH failed_docs_cursor INTO v_ent_id;
  EXIT WHEN failed_docs_cursor%NOTFOUND;

  UPDATE "ACCELA"."BDOCUMENT" set B1_PER_ID1=substr(v_ent_id,0,5),B1_PER_ID2=substr(v_ent_id,7,5),B1_PER_ID3=substr(v_ent_id,13,5), doc_comment='ACCELA'
	, file_db_type='ACCELA', file_db_server='ACCELA',ENT_TYPE='CAP'
	WHERE ent_id=v_ent_id and serv_prov_code=AGENCY AND REC_STATUS='A';
  UPDATE "ACCELA"."XDOCUMENT_ENTITY" SET ENT_TYPE='CAP' where ent_id =v_ent_id AND  serv_prov_code=AGENCY AND REC_STATUS='A';
  v_count:= v_count+SQL%ROWCOUNT;

END LOOP;
END;

/*--Check result ---------------------------------------------------------------------------------*/

/*OPEN sp_cursor FOR SELECT bd.serv_prov_code, bd.b1_per_id1, bd.b1_per_id2, bd.b1_per_id3, b1.b1_alt_id FROM BDOCUMENT bd
INNER JOIN b1permit b1 ON bd.serv_prov_code = b1.serv_prov_code AND bd.b1_per_id1 = b1.b1_per_id1 AND bd.b1_per_id2 = b1.b1_per_id2
AND bd.b1_per_id3 = b1.b1_per_id3
WHERE bd.serv_prov_code=AGENCY AND bd.ENT_TYPE='TMP_CAP' AND (bd.B1_PER_ID1||'-'||bd.B1_PER_ID2||'-'||bd.B1_PER_ID3)<>bd.ENT_ID
AND bd.SOURCE='ACCELA' AND bd.REC_STATUS='A' AND bd.B1_PER_ID1 IS NOT NULL;
*/
EXCEPTION

  --When null value exception occurs raise below exception
  WHEN null_value THEN
  raise_application_error(-20001, 'ELP_SP_REMOTE_DOCUMENTS:  One or more of the IN Parameters are Null agency : ' || AGENCY);
  ROLLBACK;

  --When other exception occurs raise below exception
  WHEN others THEN
  v_erm := substr(sqlerrm,1,64);
  raise_application_error(-20099, 'Caught Exception: '||v_erm);
  ROLLBACK;


END ELP_SP_PROMOTE_DOCUMENTS;