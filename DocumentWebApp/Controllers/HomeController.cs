using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using MS_DOCS.Models;
using System.Security.Claims;
using System.Linq;
using System.Diagnostics;
using MS_DOCS.Services.Interfaces;
using System.Threading.Tasks;

namespace MS_DOCS.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IErrorLoggingService _errorLoggingService;

        public HomeController(ILogger<HomeController> logger, IErrorLoggingService errorLoggingService)
        {
            _logger = logger;
            _errorLoggingService = errorLoggingService;
        }

     
        public IActionResult Index()
        {
            // Allow anonymous users to access the home page
            return View();
        }
        
        [Authorize(Roles = "Viewer")]
        public IActionResult ViewerDashboard()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task<IActionResult> Error()
        {
            var isProduction = await _errorLoggingService.IsProductionEnvironmentAsync();
            
            var errorViewModel = new ErrorViewModel 
            { 
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier,
                IsProduction = isProduction,
                ReferenceCode = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()
            };
            
            if (!isProduction)
            {
                // In development, show more details
                if (HttpContext.Items.ContainsKey("OriginalException"))
                {
                    errorViewModel.ErrorMessage = (HttpContext.Items["OriginalException"] as Exception)?.Message;
                }
            }
            else
            {
                // In production, show generic message
                errorViewModel.ErrorMessage = "An unexpected error occurred. Our technical team has been notified.";
            }
            
            return View(errorViewModel);
        }
    }
}
