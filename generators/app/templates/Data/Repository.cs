using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace <%= projectName %>.Data.Repositories
{
    public class Repository<TEntity> : IRepository<TEntity> where TEntity : class
    {
        protected readonly <%= projectName %>DbContext Context;

        public Repository(<%= projectName %>DbContext context)
        {
            Context = context;
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync()
        {
            return await Context.Set<TEntity>().ToListAsync();
        }

        public async Task<TEntity> GetByIdAsync(int id)
        {
            return await Context.Set<TEntity>().FindAsync(id);
        }

        public async Task<IEnumerable<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await Context.Set<TEntity>().Where(predicate).ToListAsync();
        }

        public async Task AddAsync(TEntity entity)
        {
            await Context.Set<TEntity>().AddAsync(entity);
        }

                public async Task AddRangeAsync(IEnumerable<TEntity> entities)
        {
            await Context.Set<TEntity>().AddRangeAsync(entities);
        }

        public void Remove(TEntity entity)
        {
            Context.Set<TEntity>().Remove(entity);
        }

        public void RemoveRange(IEnumerable<TEntity> entities)
        {
            Context.Set<TEntity>().RemoveRange(entities);
        }

        public void Update(TEntity entity)
        {
            Context.Set<TEntity>().Update(entity);
        }

        public async Task<IEnumerable<TEntity>> GetPagedAsync(
            Expression<Func<TEntity, bool>> filter = null,
            Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>> orderBy = null,
            int? pageNumber = null,
            int? pageSize = null)
        {
            IQueryable<TEntity> query = Context.Set<TEntity>();

            if (filter != null)
            {
                query = query.Where(filter);
            }


            if (orderBy != null)
            {
                query = orderBy(query);
            }

            if (pageNumber.HasValue && pageSize.HasValue)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            return await query.ToListAsync();
        }
    }
}

