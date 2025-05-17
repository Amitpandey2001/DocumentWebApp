using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MS_DOCS.DAL.Common;
using MS_DOCS.Services.Interfaces;
using System.Data;
using System.Data.SqlClient;

namespace MS_DOCS.Services.Implementations
{
    public class SQLHelper : ISQLHelper
    {
        private readonly string _connectionString;

        public SQLHelper(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public SqlDataReader ExecuteReaderSP(string procedureName, SqlParameter[] parameters = null)
        {
            var connection = new SqlConnection(_connectionString);
            try
            {
                connection.Open();
                var command = CreateCommand(connection, procedureName, parameters);
                return command.ExecuteReader(CommandBehavior.CloseConnection);
            }
            catch
            {
                connection.Dispose();
                throw;
            }
        }

        public async Task<SqlDataReader> ExecuteReaderSPAsync(string procedureName, SqlParameter[] parameters = null)
        {
            var connection = new SqlConnection(_connectionString);
            try
            {
                await connection.OpenAsync();
                var command = CreateCommand(connection, procedureName, parameters);
                return await command.ExecuteReaderAsync(CommandBehavior.CloseConnection);
            }
            catch
            {
                connection.Dispose();
                throw;
            }
        }

        public async Task<int> ExecuteNonQuerySPAsync(string procedureName, SqlParameter[] parameters = null)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                try
                {
                    await connection.OpenAsync();
                    using (var command = CreateCommand(connection, procedureName, parameters))
                    {
                        return await command.ExecuteNonQueryAsync();
                    }
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }

        public async Task<T> ExecuteScalarSPAsync<T>(string procedureName, SqlParameter[] parameters = null)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                try
                {
                    await connection.OpenAsync();
                    using (var command = CreateCommand(connection, procedureName, parameters))
                    {
                        var result = await command.ExecuteScalarAsync();
                        return result == DBNull.Value ? default : (T)result;
                    }
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
        public async Task<DataSet> ExecuteDataSetSPAsync(string query, SqlParameter[] parameters)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                try
                {
                    await connection.OpenAsync();
                    using (var command = CreateCommand(connection, query, parameters))
                    {
                        using (var adapter = new SqlDataAdapter(command))
                        {
                            DataSet ds = new DataSet();
                            await Task.Run(() => adapter.Fill(ds)); // Fill operation is synchronous, so offload it
                            return ds;
                        }
                    }
                }
                catch (Exception ex)
                {
                    throw new IITMSException("IITMS.SQLServer.SQLDAL.SQLHelper.ExecuteDataSetSPAsync -> " + ex.ToString());
                }
            }
        }

        public DataSet ExecuteDataSetSP(String query, SqlParameter[] parameters)
        {
            DataSet ds = null;
            try
            {
                SqlConnection cnn = new SqlConnection(_connectionString);
                SqlCommand cmd = new SqlCommand(query, cnn);
                if (query.StartsWith("SELECT") | query.StartsWith("select") | query.StartsWith("INSERT") | query.StartsWith("insert") | query.StartsWith("UPDATE") | query.StartsWith("update") | query.StartsWith("DELETE") | query.StartsWith("delete"))
                    cmd.CommandType = CommandType.Text;
                else
                    cmd.CommandType = CommandType.StoredProcedure;

                int i;
                for (i = 0; i < parameters.Length; i++)
                    cmd.Parameters.Add(parameters[i]);
                cmd.CommandTimeout = 300;
                SqlDataAdapter da = new SqlDataAdapter();
                da.SelectCommand = cmd;
                ds = new DataSet();
                da.Fill(ds);
            }
            catch (Exception ex)
            {
                ds = null;
                throw new IITMSException("IITMS.SQLServer.SQLDAL.SQLHelper.ExecuteDataSetSP-> " + ex.ToString());
            }
            return ds;
        }
        public object ExecuteNonQuerySP(String query, SqlParameter[] parameters, bool flag)
        {
            SqlConnection cnn = new SqlConnection(_connectionString);
            SqlCommand cmd = new SqlCommand(query, cnn);

            if (query.StartsWith("INSERT") | query.StartsWith("insert") | query.StartsWith("UPDATE") | query.StartsWith("update") | query.StartsWith("DELETE") | query.StartsWith("delete"))
                cmd.CommandType = CommandType.Text;
            else
                cmd.CommandType = CommandType.StoredProcedure;

            int i;
            for (i = 0; i < parameters.Length; i++)
                cmd.Parameters.Add(parameters[i]);

            object retval = null;
            try
            {
                cnn.Open();
                cmd.CommandTimeout = 1200;
                retval = cmd.ExecuteNonQuery();

                //output parameter
                if (flag == true)
                    retval = cmd.Parameters[parameters.Length - 1].Value;
            }
            catch (Exception ex)
            {
                retval = null;
                throw new IITMSException("IITMS.SQLServer.SQLDAL.SQLHelper.ExecuteNonQuerySP-> " + ex.ToString());
            }
            finally
            {
                if (cnn.State == ConnectionState.Open) cnn.Close();
            }
            return retval;
        }


        private SqlCommand CreateCommand(SqlConnection connection, string procedureName, SqlParameter[] parameters)
        {
            var command = connection.CreateCommand();
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = procedureName;
            command.CommandTimeout = 30; // 30 seconds timeout

            if (parameters != null)
            {
                command.Parameters.AddRange(parameters);
            }

            return command;
        }
    }
}
