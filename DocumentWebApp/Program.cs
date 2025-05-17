using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics;
using MS_DOCS.Services.Implementations;
using MS_DOCS.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("BlobStoragePolicy",
        builder =>
        {
            builder
                .WithOrigins("https://localhost:7124")
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddScoped<ISQLHelper, SQLHelper>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IDocumentationService, DocumentationService>();
builder.Services.AddScoped<IBlobStorageService, AzureBlobStorageService>();
builder.Services.AddScoped<IErrorLoggingService, ErrorLoggingService>();

// Add authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Auth/Login";
        options.LogoutPath = "/Auth/Logout";
        options.AccessDeniedPath = "/Auth/AccessDenied";
        options.Cookie.Name = "MS_DOCS.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; 
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
    });

// Add authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireEditor", policy => policy.RequireRole("Editor", "Admin"));
    options.AddPolicy("RequireViewer", policy => policy.RequireRole("Viewer", "Editor", "Admin"));
    
    // Project-specific admin policy
    options.AddPolicy("ProjectAdmin", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "ProjectAdmin")));
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Use developer exception page in development mode
    app.UseDeveloperExceptionPage();
}
else
{
    // Use custom exception handler for production
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            // Skip handling for authentication-related paths
            if (context.Request.Path.StartsWithSegments("/Auth"))
            {
                return;
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "text/html";

            var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
            var exception = exceptionHandlerPathFeature?.Error;

            if (exception != null)
            {
                // Store the exception for the error page to use
                context.Items["OriginalException"] = exception;

                // Log the exception
                var errorLoggingService = context.RequestServices.GetService<IErrorLoggingService>();
                if (errorLoggingService != null)
                {
                    await errorLoggingService.LogErrorAsync(
                        exception,
                        $"{context.Request.Method} {context.Request.Path}",
                        $"QueryString: {context.Request.QueryString}, User: {context.User?.Identity?.Name ?? "Anonymous"}"
                    );
                }
            }

            // Redirect to the error page
            context.Response.Redirect("/Home/Error");
        });
    });
}

app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();

// Use CORS before routing
app.UseCors("BlobStoragePolicy");

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
