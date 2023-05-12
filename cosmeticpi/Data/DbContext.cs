using Microsoft.EntityFrameworkCore;
using cosmeticpi.Models;

namespace cosmeticpi.Data
{
    public class cosmeticpiDbContext : DbContext
    {
        public cosmeticpiDbContext(DbContextOptions<cosmeticpiDbContext> options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Add any entity configurations using modelBuilder here
        }

        public DbSet<User> Users { get; set; }
public DbSet<Person> Persons { get; set; }
public DbSet<Product> Products { get; set; }
// Add any Dbset configurations here
    }
}