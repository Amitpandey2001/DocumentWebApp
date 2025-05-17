using System.Security.Claims;

namespace MS_DOCS.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst("UserId");
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User ID not found in claims");
            }

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID format");
            }

            return userId;
        }
    }
}
