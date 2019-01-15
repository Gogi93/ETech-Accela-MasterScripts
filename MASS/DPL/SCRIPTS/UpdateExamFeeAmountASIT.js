var vSQL = "update BAPPSPECTABLE_VALUE ASIT\
	set attribute_value = '0' \
	where 1=1 \
	and serv_prov_code = 'DPL' \
	and table_name = 'EXAM VENDOR CASH INFO' \
	and column_name = 'Fee Amount' \
	and attribute_value = 'null' \
	";

doSQL(vSQL);

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
			return array
		} else if (sql.toUpperCase().indexOf("UPDATE") == 0) {
			aa.print("executing update: " + sql);
			var rOut = sStmt.executeUpdate();
			aa.print(rOut + " rows updated");
			return array
		} else {
			aa.print("executing : " + sql);
			var rOut = sStmt.execute();
			aa.print(rOut);
			return array
		}
		sStmt.close();
		conn.close();
		return array
	} catch (err) {
		aa.print(err.message);
		return array
	}
}
