#!/usr/bin/perl
use MP3::Tag;
use MP3::Info;
use POSIX;
use Encode;
use Encode::KR;
use Encode::Guess;
use JSON;
use utf8;
binmode(STDOUT, ":utf8");

my $mp3file = $ARGV[0];
my $imgfile = $ARGV[1];

my $mp3 = MP3::Tag->new($mp3file) or die "no file";
$mp3->get_tags;
my $id3v2 = $mp3->{ID3v2};

my $info = get_mp3info($mp3file);

my %tag = parse_tags($mp3, $id3v2, $info);

my $json = encode_json \%tag;
print $json;

#save_img($id3v2, $imgfile) if defined $imgfile;

$mp3->close();

sub parse_tags {
	my $mp3 = shift;
	my $id3v2 = shift;
	my $info = shift;

	my %tag;

	$tag{"title"} = convert_text($mp3->title());
	$tag{"track"} = convert_number($mp3->track1());
	$tag{"disk"} = convert_number($mp3->disk1());
	$tag{"artist"} = convert_text($mp3->artist());
	$tag{"album"} = convert_text($mp3->album());
	$tag{"albumAritst"} = convert_text($id3v2->get_frame("TPE2"));
	$tag{"year"} = convert_number($mp3->year());
	$tag{"genre"} = convert_text($mp3->genre());
	$tag{"time"} = ceil($info->{SECS});
	$tag{"bitrate"} = $info->{BITRATE};

	$tag{"albumArtist"} = $tag{"artist"} if ($tag{"albumArstist"} eq "");

	return %tag;
}

sub convert_number {
	my $num = shift;
	chomp $num;

	return 0 if (!defined $num || $num eq "");
	return $num;
}

sub convert_text {
	my $text = shift;
	chomp $text;

	return "" if (!defined $text || $text eq "");

	my $enc = guess_encoding($text, qw/cp949 utf-8/);

	$text = decode($enc->name, $text) unless utf8::is_utf8($text);
	return $text;
}

sub save_img {
	my $id3v2 = shift;
	my $imgfile = shift;

	my $pic = $id3v2->get_frame("APIC");
	open (SAVE, ">$imgfile");
	binmode SAVE;
	print SAVE $pic->{_Data};
	close SAVE;
}
