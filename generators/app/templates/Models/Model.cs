namespace <%= projectName %>.Models
{
    public class <%= modelName %>
    {
    <% for (let field of fields) { %>
        public <%= field.type %> <%= field.name %> { get; set; }
    <% } %>
    }
}