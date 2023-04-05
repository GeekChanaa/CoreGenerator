using Microsoft.EntityFrameworkCore;
using <%= projectName %>.Models;

namespace <%= projectName %>.Data
{
    public class <%= projectName %>DbContext : DbContext
    {
        public <%= projectName %>DbContext(DbContextOptions<<%= projectName %>DbContext> options) : base(options)
        {
        }

        public DbSet<YourEntity> YourEntities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Add any entity configurations using modelBuilder here
        }
    }
}