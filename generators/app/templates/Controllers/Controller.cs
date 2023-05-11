using <%= projectName %>.Models;
using Microsoft.AspNetCore.Mvc;
using <%= projectName %>.Data;
using <%= projectName %>.Models;
using <%= projectName %>.Dtos;
using System.Threading.Tasks;
using System.Text;
using Microsoft.Extensions.Configuration;
using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Net.Http;
using System.Net;
using <%= projectName %>.Data.Repositories;

namespace <%= projectName %>.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class <%= modelName %>Controller : GenericController<<%= modelName %>>
    {
        private readonly IRepository<<%= modelName %>> _repository;

        public <%= modelName %>Controller(IRepository<<%= modelName %>> repository) : base(repository)
        {
            _repository = repository;
        }

        // You can override the base methods or add specific methods for this controller
    }
}