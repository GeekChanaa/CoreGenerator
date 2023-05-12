using System.Threading.Tasks;
using cosmeticpi.Models;
using Microsoft.EntityFrameworkCore;
using System;
using cosmeticpi.Helpers;

namespace cosmeticpi.Data
{
    public class AuthRepository : IAuthRepository
    {
        private readonly cosmeticpiDbContext _context;
        public AuthRepository(cosmeticpiDbContext context)
        {
            this._context = context;
        }

        public async Task<User> Register(User user, string password){
            byte[] passwordHash, passwordSalt;
            CreatePasswordHash(password, out passwordHash, out passwordSalt);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using(var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            }
        }

        public async Task<User> Login(string email, string password){
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
            if(user == null)
                return null;
            if(!VerifyPasswordHash(password, user.PasswordHash, user.PasswordSalt))
                return null;
            return user;
        }

        public bool VerifyPasswordHash(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            using(var hmac = new System.Security.Cryptography.HMACSHA512(passwordSalt)){
                var computedHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                for(int i=0; i< computedHash.Length ; i ++)
                {
                    if(computedHash[i] != passwordHash[i]) return false;
                }
            }
            return true;
        }

        // Unicity of Email
        public async Task<bool> UserExists(string email)
        {
            if(await _context.Users.AnyAsync(x=>x.Email == email))
            {
                return true;
            }
            return false;
        }

        // Getting user
        public Task<User> GetUser(int id){
            // Getting The user and some of its navigation properties
            var user = _context.Users.FirstOrDefaultAsync(u => u.ID == id);
            return user;
        }
    }
}