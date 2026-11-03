namespace Fitness.Core.Entities
{
    public class MembershipPackage : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationMonths { get; set; }
        public bool ShowOnWebsite { get; set; } = false;
    }
}
