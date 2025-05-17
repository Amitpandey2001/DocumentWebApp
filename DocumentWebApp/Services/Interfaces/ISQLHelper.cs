using System.Data;
using System.Data.SqlClient;

namespace MS_DOCS.Services.Interfaces
{
    public interface ISQLHelper
    {
        SqlDataReader ExecuteReaderSP(string procedureName, SqlParameter[] parameters = null);
        Task<SqlDataReader> ExecuteReaderSPAsync(string procedureName, SqlParameter[] parameters = null);
        Task<int> ExecuteNonQuerySPAsync(string procedureName, SqlParameter[] parameters = null);
        Task<T> ExecuteScalarSPAsync<T>(string procedureName, SqlParameter[] parameters = null);
        DataSet ExecuteDataSetSP(string procedureName, SqlParameter[] parameters = null);
        object ExecuteNonQuerySP(string procedureName, SqlParameter[] parameters, bool flag);
        Task<DataSet> ExecuteDataSetSPAsync(string procedureName, SqlParameter[] parameters = null);
       
    }
}
