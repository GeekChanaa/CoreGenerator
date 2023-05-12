using cosmeticpi.Models;
using Microsoft.AspNetCore.Mvc;
using cosmeticpi.Data;
using cosmeticpi.Models;
using cosmeticpi.Dtos;
using System.Threading.Tasks;
using System.Text;
using Microsoft.Extensions.Configuration;
using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Net.Http;
using System.Net;
using cosmeticpi.Data.Repositories;

namespace cosmeticpi.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : GenericController<Product>
    {
        private readonly IRepository<Product> _repository;

        public ProductController(IRepository<Product> repository) : base(repository)
        {
            _repository = repository;
        }

        // You can override the base methods or add specific methods for this controller
    }
}