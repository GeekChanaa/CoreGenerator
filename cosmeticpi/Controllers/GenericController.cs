using Microsoft.AspNetCore.Mvc;
using cosmeticpi.Data;
using cosmeticpi.Models;
using cosmeticpi.Dtos;
using System.Threading.Tasks;
using System.Security.Claims;
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
    public class GenericController<T> : ControllerBase where T : class
    {
        private readonly IRepository<T> _repository;

        public GenericController(IRepository<T> repository)
        {
            _repository = repository;
        }

        // GET: api/T
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var entities = await _repository.GetAllAsync();
            return Ok(entities);
        }

        // GET: api/T/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
            {
            return NotFound();
            }
            return Ok(entity);
        }

        // PUT: api/T/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(T entityToUpdate)
        {
            if (entityToUpdate == null)
            {
                return BadRequest();
            }
            try
            {
                await _repository.Update(entityToUpdate);
                return NoContent();
            }
            catch (Exception ex)
            {
                // log exception here
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/T
        [HttpPost]
        public async Task<IActionResult> Create(T entity)
        {
            if (entity == null)
            {
            return BadRequest("Entity is null");
            }

            await _repository.AddAsync(entity);
            return CreatedAtAction("GetById", entity);
        }

        // DELETE: api/T/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            await _repository.Remove(item);
            return NoContent();
        }
    }

}