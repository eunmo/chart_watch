use LWP::Simple;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $week = $ARGV[0];
my $year = $ARGV[1];

my $url = get_url();
my $html = get("$url");
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";

for my $div ($dom->find('div[class*="row-title"]')->each) {
	my $title_norm;
	if ($div->find('h2')->first) {
		my $title = $div->find('h2')->first->text;
		$title_norm = normalize_title($title);
	}
	my $artist_norm;
	if ($div->find('a')->first) {
		my $artist_url = $div->find('a')->first->attr('href');
		my $artist = get_artist_from_url($artist_url);
		$artist_norm = normalize_artist($artist);
	} elsif ($div->find('h3')->first) {
		my $artist = $div->find('h3')->first->text;
		$artist_norm = normalize_artist($artist);
	}
	print ",\n" if $rank > 1;
	print "{ \"rank\": $rank, \"song\": \"$title_norm\", \"artist\": \"$artist_norm\" }";
	$rank++;
}

print "]";

sub get_artist_from_url($)
{
	my $artist = shift;

	$artist =~ s/^.*\///;
	$artist =~ s/-/ /;

	return $artist;
}

sub last_day_of_week
{
	my ($year, $week) = @_;

	DateTime->new( year => $year, month => 1, day => 1 )
					->add( weeks => ($week - 1) )
					->truncate( to => 'week' )
					->add( days => 5 );
}

sub get_url
{
	my $ld = last_day_of_week($year, $week);
	my $ld_ymd = $ld->ymd();

	my $url = "http://www.billboard.com/charts/hot-100/$ld_ymd";
	
	return $url;
}

sub normalize_title($)
{
	my $string = shift;
	
	$string =~ s/\(.*$//;
	$string =~ s/\s+$//g;
	$string =~ s/[\'’]/`/g;

	return $string;
}

sub normalize_artist($)
{
	my $string = shift;
	
	$string =~ s/\|.*$//;
	$string =~ s/\(.*?\)//g;
	$string =~ s/[,&＆].*$//g;
	$string =~ s/\s+$//;

	if ($string =~ /^weeknd$/) { return "The Weeknd"; }
	
	return $string;
}
