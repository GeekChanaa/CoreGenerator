using System.Runtime.InteropServices;
using System.Net.Mail;
using HygeneApi.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using HygeneApi.Data;
using HygeneApi.HubConfig;
using HygeneApi.Models;
using HygeneApi.Helpers;
using HygeneApi.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace HygeneApi.Controllers
{
    [Route("api/[controller]")]
    public class BaseController<T> : ControllerBase where T : class
    {
        protected readonly ConcreetDataContext _context;
        protected readonly IBaseRepository<T> _repo;
        protected readonly INotificationRepository _notificationRepo;
        protected readonly IHubContext<NotificationHub> _hubContext;
        protected readonly DbSet<T> _dbSet;
        protected readonly IMailService _mailService;

        public string NotificationType { get; set; }
        public string NotificationUrl { get; set; }
        
        
        
        

        public BaseController(IHubContext<NotificationHub> hubContext,
                            ConcreetDataContext context,  
                            IBaseRepository<T> repo, 
                            INotificationRepository notifRepo,
                            IMailService mailService)
        {
            _context = context; 
            _hubContext = hubContext;
            _repo = repo;
            _dbSet = _context.Set<T>();
            _notificationRepo = notifRepo;
            _mailService = mailService;
        }

        // GET: api/[items]
        [HttpGet]
        // HERE's THE ISSUE
        public virtual async Task<ActionResult<IEnumerable<T>>> Get([FromQuery] GlobalParams globalParams)
        {
            Type t = typeof(T);
            Console.WriteLine(t.Name.ToUpper());
            var classes = await PagedList<T>.CreateAsync(_repo.Get(globalParams),globalParams.PageNumber,globalParams.PageSize);
            Response.AddPagination(classes.CurrentPage, classes.PageSize, classes.TotalCount, classes.TotalPages);
            return Ok(classes); 
        }

        // GET: api/[items]/5
        [HttpGet("{id}")]
        public virtual async Task<ActionResult<T>> Get(int id)
        {
            var item = await this._repo.GetByID(id);

            if (item == null)
            {
                return NotFound();
            }
            

            return item;
        }

        // PUT: api/[items]/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Put(int id, T item)
        {
            // if (id != item.ID)
            // {
            //     return BadRequest();
            // }
            try
            {
                await this._repo.Update(item);
                // Creating the notifications for the users
                var notificationSettings = this._context.NotificationSettings.Include(u => u.User).Where(u => u.NotificationType.Name == this.NotificationType).Where(u => u.Active == true).ToList();
                var useID = Request.HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
                foreach(var notificationSetting in notificationSettings)
                {
                    var notification = await this._notificationRepo.CreateNotification("Update",typeof(T).ToString(),"Updated "+typeof(T).ToString()+" with ID : "+id,"active",notificationSetting.NotificationTypeID,notificationSetting.UserID,notificationSetting.Urgent,this.NotificationUrl+"/"+id);
                    await _hubContext.Clients.User(notificationSetting.UserID.ToString()).SendAsync("simo",notification);
                }
                await _context.SaveChangesAsync();
            
                // Invoking BroadCastToUserFunction 
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!(await Exists(id)))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Classes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async virtual Task<ActionResult<T>> Post(T item)
        {
            await this._repo.Insert(item);
            // Creating the notifications for the users
            var notificationSettings = this._context.NotificationSettings.Include(u => u.User).Where(u => u.NotificationType.Name == this.NotificationType).Where(u => u.Active == true).ToList();
            var useID = Request.HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

            
            await _context.SaveChangesAsync();
            foreach(var notificationSetting in notificationSettings)
            {
                var notification = await this._notificationRepo.CreateNotification("Create",typeof(T).ToString(),"Created "+typeof(T).ToString(),"active",notificationSetting.NotificationTypeID,notificationSetting.UserID,notificationSetting.Urgent, this.NotificationUrl);
                await _hubContext.Clients.User(notificationSetting.UserID.ToString()).SendAsync("simo",notification);
            }
            return CreatedAtAction("Get", item);
        }

        // DELETE: api/Classes/5
        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            var item = await _dbSet.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            _dbSet.Remove(item);
            await _context.SaveChangesAsync();

            // Creating the notifications for the users
            var notificationSettings = this._context.NotificationSettings.Include(u => u.User).Where(u => u.NotificationType.Name == this.NotificationType).Where(u => u.Active == true).ToList();
            var useID = Request.HttpContext.User.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

            foreach(var notificationSetting in notificationSettings)
            {
                var notification = await this._notificationRepo.CreateNotification("Delete",typeof(T).ToString(),"Deleted "+typeof(T).ToString(),"active",notificationSetting.NotificationTypeID,notificationSetting.UserID,notificationSetting.Urgent,this.NotificationUrl);
                await _hubContext.Clients.User(notificationSetting.UserID.ToString()).SendAsync("simo",notification);
                if(notificationSetting.Email) await this._mailService.SendNotificationAsync(notification);
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<bool> Exists(int id)
        {
            var item = await this._repo.GetByID(id);
            if(item != null)
            return true;
            return false;
        }
        
        [HttpGet("count")]
        public async Task<ActionResult<int>> Count([FromQuery] GlobalParams globalParams)
        {
            return await this._repo.Count(globalParams);
        }
    }
}