using MS_DOCS.Models;

namespace MS_DOCS.Services.Interfaces
{
    public interface IUserService
    {
        User GetUserByEmail(string email);
        int CreateUser(User user, string password);
        List<string> GetUserRoles(int userId);
        bool VerifyUser(string password, string passwordHash);
    }
}
