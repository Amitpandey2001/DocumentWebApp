using System.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;
using MS_DOCS.Models;
using MS_DOCS.Services.Interfaces;
using MS_DOCS.DAL.Common;
using mastersofterp;

namespace MS_DOCS.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly ISQLHelper _sqlHelper;

        public UserService(ISQLHelper sqlHelper)
        {
            _sqlHelper =  sqlHelper;
        }
        #region Get User Data
        public User GetUserByEmail(string email)
        {
            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@Email", email)
            };

            using (SqlDataReader reader = _sqlHelper.ExecuteReaderSP("sp_GetUserByEmail", parameters))
            {
                User user = null;
                while (reader.Read())
                {
                    if (user == null)
                    {
                        user = new User
                        {
                            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
                            CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                            Roles = new List<string>()
                        };
                    }
                    if (!reader.IsDBNull(reader.GetOrdinal("RoleName")))
                    {
                        user.Roles.Add(reader.GetString(reader.GetOrdinal("RoleName")));
                    }
                }
                return user;
            }
        }

        public List<string> GetUserRoles(int userId)
        {
            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@UserId", userId)
            };

            var roles = new List<string>();
            using (SqlDataReader reader = _sqlHelper.ExecuteReaderSP("sp_GetUserRoles", parameters))
            {
                while (reader.Read())
                {
                    roles.Add(reader.GetString(reader.GetOrdinal("RoleName")));
                }
            }
            return roles;
        }
        #endregion

        #region Verify User
        public bool VerifyUser(string password, string passwordHash)
        {
            string user_pwd = clsTripleLvlEncyrpt.EncryptPassword(password);// Encrypt withMasterSoft Logic
            user_pwd = clsTripleLvlEncyrpt.OneAESEncrypt(user_pwd); // Encrypt with One AES

            string db_pwd = clsTripleLvlEncyrpt.RSADecryption(passwordHash.ToString());
            if (user_pwd == db_pwd)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        #endregion
        public int CreateUser(User user, string password)
        {
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(password, 11);

            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@Username", user.Username),
                new SqlParameter("@Email", user.Email),
                new SqlParameter("@PasswordHash", passwordHash),
                new SqlParameter("@IsActive", user.IsActive),
                new SqlParameter("@UserId", SqlDbType.Int) { Direction = ParameterDirection.Output }
            };

            var result = _sqlHelper.ExecuteNonQuerySP("sp_CreateUser", parameters, true);
            return Convert.ToInt32(result);
        }
    }
}
