using System.ComponentModel.DataAnnotations;

namespace horizon.Data.Models;

public class Servers
{
    [Key]
    public string ServerKey { get; set; }
    public int CT { get; set; }
    public int TERRORIST { get; set; }
    public string Map { get; set; }
    public int Rounds { get; set; }
    public bool Admin { get; set; }

}