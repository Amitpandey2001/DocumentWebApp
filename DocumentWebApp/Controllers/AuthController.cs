using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MS_DOCS.Models;
using MS_DOCS.Models.ViewModels;
using MS_DOCS.Services.Interfaces;
using System.Security.Claims;
using mastersofterp;


namespace MS_DOCS.Controllers
{
    public class AuthController : Controller
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;
        private readonly IErrorLoggingService _errorLoggingService;

        public AuthController(
            IUserService userService, 
            ILogger<AuthController> logger,
            IErrorLoggingService errorLoggingService)
        {
            _userService = userService;
            _logger = logger;
            _errorLoggingService = errorLoggingService;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Login()
        {
            // If user is already authenticated, redirect to home page
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var user = _userService.GetUserByEmail(model.Email);
                    if (user != null && _userService.VerifyUser(model.Password, user.PasswordHash))
                    {
                        var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, user.Username),
                            new Claim(ClaimTypes.Email, user.Email),
                            new Claim("UserId", user.UserId.ToString())
                        };

                        var roles = _userService.GetUserRoles(user.UserId);
                        foreach (var role in roles)
                        {
                            claims.Add(new Claim(ClaimTypes.Role, role));
                        }

                        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                        var authProperties = new AuthenticationProperties
                        {
                            IsPersistent = model.RememberMe,
                            ExpiresUtc = model.RememberMe ? DateTimeOffset.UtcNow.AddDays(7) : null
                        };

                        await HttpContext.SignInAsync(
                            CookieAuthenticationDefaults.AuthenticationScheme,
                            new ClaimsPrincipal(claimsIdentity),
                            authProperties);

                        return RedirectToAction("Index", "Home");
                    }

                    ModelState.AddModelError("", "Invalid email or password");
                }
                return View(model);
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, "Login error for user {Email}", model.Email);
                
                if (_errorLoggingService != null)
                {
                    await _errorLoggingService.LogErrorAsync(
                        ex,
                        "AuthController.Login",
                        $"Login attempt for email: {model.Email}"
                    );
                }
                
                // Add a generic error message
                ModelState.AddModelError("", "An error occurred during login. Please try again later.");
                
                // Return to login page with the error
                return View(model);
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult Register()
        {
            // If user is already authenticated, redirect to home page
            if (User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public IActionResult Register(RegisterViewModel model)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    var user = new User
                    {
                        Username = model.Username,
                        Email = model.Email,
                        IsActive = true
                    };

                    _userService.CreateUser(user, model.Password);
                    return RedirectToAction(nameof(Login));
                }
                catch (InvalidOperationException ex)
                {
                    // Log the exception but don't expose the message to the user
                    // Instead, provide a generic message
                    ModelState.AddModelError("", "Registration failed. The email or username may already be in use.");
                }
            }
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Login", "Auth");
        }
    }
}
