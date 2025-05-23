﻿using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models.Auth
{
    public class LoginModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }

}
