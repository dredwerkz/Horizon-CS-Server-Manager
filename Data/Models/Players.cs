using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace horizon.Data.Models;

public class Players
{
    [Key]
    public int Id { get; set;}
    public string Name { get; set; }
    [ForeignKey("Teams")]
    public int TeamId { get; set; }
    
    public Teams Teams { get; set; }
}