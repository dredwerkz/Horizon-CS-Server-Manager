using System.ComponentModel.DataAnnotations;

namespace horizon.Data.Models;

public class Teams
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; }
    
    public ICollection<Players> Players { get; set; }
}